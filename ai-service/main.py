import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_groq import ChatGroq
import hashlib

# Add parent dir for create.py
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import helpers
from create import process_document_and_add_to_db, get_chroma_db

# LangChain imports
from langchain_core.prompts import PromptTemplate
from langchain_community.embeddings import HuggingFaceBgeEmbeddings

# Load env vars
load_dotenv()

# Flask setup
app = Flask(__name__)
CORS(app)

# Global QA chain
qa_chain = None

# ✅ Use LangChain's Groq wrapper directly
chat_model = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.1-8b-instant",
    temperature=0.3,  # Slightly higher for more creative responses
)

# Load embeddings
try:
    embeddings = HuggingFaceBgeEmbeddings(model_name="BAAI/bge-large-en-v1.5")
    print("✅ Embeddings model loaded successfully.")
except Exception as e:
    print(f"❌ Error loading embeddings model: {e}")
    sys.exit()

# -------------------------------
# Enhanced Hybrid QA Templates
# -------------------------------

# Template for when we have good context from platform resources
context_rich_template = """You are an intelligent assistant helping users with information from a collaborative knowledge platform.

KNOWLEDGE INTEGRATION INSTRUCTIONS:
- You have access to specific documents and resources uploaded by users on this platform
- Combine the provided context with your general knowledge to give comprehensive answers
- When platform resources are relevant, prioritize and integrate them naturally with your knowledge
- Provide detailed, educational responses that feel natural and complete
- Don't mention whether you're using "platform resources" or "general knowledge" - just give seamless answers

PLATFORM CONTEXT:
{context}

USER QUESTION: {question}

Provide a comprehensive answer that naturally integrates the platform resources with relevant general knowledge:"""

# Template for when context is weak but question is answerable
general_knowledge_template = """You are an intelligent assistant on a collaborative knowledge platform.

The user asked a question that isn't directly covered by the uploaded resources on our platform, but you can still provide valuable information from your general knowledge.

USER QUESTION: {question}

AVAILABLE PLATFORM CONTEXT (limited relevance):
{context}

Provide a helpful, comprehensive answer using your knowledge. If any of the platform context is somewhat relevant, weave it in naturally:"""

# Template for determining context quality
context_evaluation_template = """Analyze if the provided context is relevant and useful for answering the user's question.

CONTEXT:
{context}

QUESTION: {question}

Rate the relevance on a scale of 1-5:
1 = Completely irrelevant
2 = Barely relevant
3 = Somewhat relevant
4 = Mostly relevant  
5 = Highly relevant

Respond with only a number (1-5):"""


def evaluate_context_quality(context, question):
    """Evaluate how relevant the retrieved context is to the question"""
    if not context or context.strip() == "No relevant documents.":
        return 1
    
    try:
        eval_prompt = PromptTemplate(
            template=context_evaluation_template, 
            input_variables=["context", "question"]
        )
        eval_chain = eval_prompt | chat_model
        
        response = eval_chain.invoke({"context": context, "question": question})
        relevance_score = int(response.content.strip())
        return min(max(relevance_score, 1), 5)  # Ensure score is between 1-5
    except:
        return 3  # Default to moderate relevance if evaluation fails


def get_enhanced_retrieval(retriever, question, k=5):
    """Enhanced retrieval with multiple strategies"""
    try:
        # Get more documents initially
        docs = retriever.get_relevant_documents(question)
        
        # If we get very few results, try a broader search
        if len(docs) < 2:
            # Extract key terms for broader search
            key_terms = question.lower().split()
            broader_query = " ".join([term for term in key_terms if len(term) > 3])
            if broader_query and broader_query != question.lower():
                broader_docs = retriever.get_relevant_documents(broader_query)
                docs.extend(broader_docs)
        
        # Remove duplicates based on content hash
        seen_content = set()
        unique_docs = []
        for doc in docs:
            content_hash = hashlib.md5(doc.page_content.encode()).hexdigest()
            if content_hash not in seen_content:
                seen_content.add(content_hash)
                unique_docs.append(doc)
        
        return unique_docs[:k]
    except Exception as e:
        print(f"❌ Error in enhanced retrieval: {e}")
        return []


def setup_qa_chain():
    global qa_chain
    db = get_chroma_db(embeddings)
    if db:
        print("⚡ Setting up Enhanced Hybrid QA chain...")

        retriever = db.as_retriever(search_kwargs={"k": 5})

        def enhanced_hybrid_chain(inputs):
            question = inputs["query"]
            
            # Enhanced retrieval
            docs = get_enhanced_retrieval(retriever, question)
            context_text = "\n\n".join([d.page_content for d in docs]) if docs else "No relevant documents."
            
            # Evaluate context quality
            context_score = evaluate_context_quality(context_text, question)
            print(f"🎯 Context relevance score: {context_score}/5")
            
            # Choose template based on context quality
            if context_score >= 3:  # Good context available
                template = context_rich_template
                print("📚 Using context-rich response strategy")
            else:  # Weak context, rely more on general knowledge
                template = general_knowledge_template
                print("🧠 Using general knowledge strategy")
            
            # Create and execute the chain
            qa_prompt = PromptTemplate(template=template, input_variables=["context", "question"])
            llm_chain = qa_prompt | chat_model
            
            response = llm_chain.invoke({"context": context_text, "question": question})
            
            return {
                "result": response.content,
                "source_documents": docs,
                "context_score": context_score,
                "strategy_used": "context_rich" if context_score >= 3 else "general_knowledge"
            }

        qa_chain = enhanced_hybrid_chain
        print("✅ Enhanced Hybrid QA chain configured.")
    else:
        qa_chain = None
        print("⚠️ ChromaDB not initialized. Cannot set up QA chain.")


# Init chain
setup_qa_chain()

# -------------------------------
# Enhanced Flask Routes
# -------------------------------
@app.route('/process-document', methods=['POST'])
def process_document_endpoint():
    data = request.json
    document_title = data.get('title')
    text_content = data.get('text')
    text_hash = data.get('text_hash')

    if not document_title or not text_content:
        return jsonify({"error": "Missing title or text content."}), 400

    print(f"📄 Processing document: {document_title}")
    
    try:
        process_document_and_add_to_db(document_title, text_content, text_hash, embeddings)
        # Refresh the QA chain after adding new documents
        setup_qa_chain()
        return jsonify({"message": f"Document '{document_title}' processed successfully."}), 200
    except Exception as e:
        print(f"❌ Error processing document: {e}")
        return jsonify({"error": "Failed to process document."}), 500


@app.route('/query', methods=['POST'])
def query_documents():
    data = request.json
    user_query = data.get('query')

    if not user_query:
        return jsonify({"error": "Missing query."}), 400

    print(f"❓ User query: {user_query}")

    # Even without documents, we can still answer using general knowledge
    if not qa_chain:
        print("🧠 No documents available, using pure general knowledge")
        try:
            # Create a simple general knowledge response
            general_prompt = PromptTemplate(
                template="""You are a helpful AI assistant on a collaborative knowledge platform.

The user asked: {question}

There are currently no documents uploaded to the platform that relate to this question, but you can still provide a helpful answer using your general knowledge.

Provide a comprehensive, educational answer:""",
                input_variables=["question"]
            )
            
            general_chain = general_prompt | chat_model
            response = general_chain.invoke({"question": user_query})
            
            return jsonify({
                "answer": response.content,
                "source_documents": [],
                "strategy_used": "pure_general_knowledge",
                "context_score": 0
            }), 200
            
        except Exception as e:
            print(f"❌ Error with general knowledge response: {e}")
            return jsonify({"error": "An error occurred while processing your query."}), 500

    try:
        result = qa_chain({"query": user_query})
        
        # Prepare response
        response_data = {
            "answer": result['result'],
            "source_documents": [],
            "strategy_used": result.get('strategy_used', 'hybrid'),
            "context_score": result.get('context_score', 0)
        }

        # Add source document info (for debugging/transparency if needed)
        for doc in result['source_documents']:
            response_data['source_documents'].append({
                "source": doc.metadata.get('source', 'Unknown Document'),
                "text_hash": doc.metadata.get('text_hash', 'N/A'),
                "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
            })

        print(f"📊 Response strategy: {response_data['strategy_used']}, Context score: {response_data['context_score']}")
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"❌ Error during query: {e}")
        return jsonify({"error": "An error occurred while processing your query."}), 500


@app.route('/stats', methods=['GET'])
def get_stats():
    """Get platform statistics"""
    try:
        db = get_chroma_db(embeddings)
        if db:
            # Get collection stats
            collection = db._collection
            count = collection.count()
            return jsonify({
                "total_documents": count,
                "status": "operational",
                "qa_chain_ready": qa_chain is not None
            }), 200
        else:
            return jsonify({
                "total_documents": 0,
                "status": "no_database",
                "qa_chain_ready": False
            }), 200
    except Exception as e:
        print(f"❌ Error getting stats: {e}")
        return jsonify({
            "total_documents": 0,
            "status": "error",
            "qa_chain_ready": False
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "qa_chain_ready": qa_chain is not None,
        "embeddings_loaded": embeddings is not None
    }), 200


if __name__ == '__main__':
    print("🚀 Starting Enhanced Hybrid QA Server...")
    print("📚 Platform will seamlessly blend uploaded resources with general knowledge")
    app.run(host='0.0.0.0', port=8000, debug=True)