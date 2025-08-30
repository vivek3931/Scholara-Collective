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
from langchain_community.vectorstores import Chroma

# Load env vars
load_dotenv()

# Flask setup
app = Flask(__name__)
CORS(app)

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
# Scholara Knowledge Manager
# -------------------------------
class ScholaraKnowledgeManager:
    def __init__(self, embeddings, chat_model):
        self.embeddings = embeddings
        self.chat_model = chat_model
        self.system_db = None
        self.user_docs_db = None
        
        # Initialize system knowledge
        self.setup_scholara_knowledge()
    
    def setup_scholara_knowledge(self):
        """Create permanent system knowledge base for Scholara Collective"""
        
        scholara_knowledge = [
            {
                "id": "what_is_scholara",
                "content": """Scholara Collective is a free, open-source academic resource sharing platform built with the MERN stack (MongoDB, Express.js, React, Node.js). It's designed to empower students by providing organized access to educational materials like class notes, previous year question papers, model answers, revision sheets, and important questions. The platform promotes collaborative learning through community-driven contributions, ratings, and discussions, ensuring high-quality, accessible resources for students globally."""
            },
            {
                "id": "platform_purpose",
                "content": """Scholara Collective addresses the challenge students face in accessing high-quality, organized academic materials, particularly those in resource-constrained environments. Many existing platforms are expensive, disorganized, or lack community engagement. Our platform provides a centralized, free solution that promotes collaboration, accessibility, and efficient resource organization, reducing barriers to education and reliance on costly or scattered study materials."""
            },
            {
                "id": "key_features",
                "content": """Scholara Collective offers comprehensive features for academic resource sharing:

1. User Authentication: Signup/login with email or Google OAuth, plus guest access for downloads with admin moderation
2. Resource Management: Upload PDFs, images, and text documents with rich metadata (subject, course, year, institution, tags)
3. Download & Preview: One-click downloads and in-browser PDF previews using react-pdf
4. Organization & Search: Advanced filtering by subject, course, institution, tags, and keyword-based search with MongoDB text indexing
5. Personal Library: Save resources to your personal collection for quick access
6. Community Features: Rate, comment, upvote resources, and flag low-quality content for admin review
7. Multi-Language Support: Available in English, Hindi, Spanish with RTL support for Arabic using i18next
8. Analytics Dashboard: Track your upload/download history and view platform usage insights with chart.js
9. AI Chatbot: Get intelligent answers about uploaded documents and general academic questions
10. Privacy & Security: Encrypted data storage, user-controlled resource visibility, GDPR-compliant data deletion"""
            },
            {
                "id": "how_to_upload",
                "content": """To upload and share resources on Scholara Collective:

1. Create an account or login (Google OAuth available for quick access)
2. Navigate to the Upload section or click the 'Upload Resource' button
3. Select your file - supported formats include PDFs, DOC, DOCX, and images (maximum 10MB per file)
4. Add comprehensive metadata:
   - Descriptive title that clearly indicates the content
   - Subject/course classification
   - Academic year or level
   - Institution or university
   - Relevant tags for better discoverability
5. Write a brief but informative description of the content and its utility
6. Choose visibility settings (public for community sharing or private)
7. Click 'Upload' to process and share with the community

Your uploads contribute to the collaborative learning ecosystem and help fellow students access quality educational materials."""
            },
            {
                "id": "how_to_download_and_search",
                "content": """Finding and downloading resources on Scholara Collective:

SEARCHING:
- Use the main search bar for keyword-based searches across all content
- Apply filters: Subject, Course, Institution, Academic Year, Resource Type
- Sort results by: Upload date, community ratings, download count, relevance
- Browse by categories or view recently uploaded content
- Use tag-based navigation for specific topics

DOWNLOADING:
1. Browse available resources using search or category filters
2. Preview documents in-browser before downloading (PDF preview available)
3. Read community ratings and comments for quality assessment
4. Click the download button (available for all users, including guests)
5. Rate and comment on resources after use to help the community
6. Save useful resources to your personal library for quick future access

All downloads are completely free and support the academic community's collaborative learning goals."""
            },
            {
                "id": "community_and_quality",
                "content": """Scholara Collective's community-driven quality system:

COMMUNITY FEATURES:
- Rate resources (1-5 stars) based on quality and usefulness
- Leave detailed comments and reviews for other students
- Upvote helpful resources to increase their visibility
- Flag inappropriate or low-quality content for admin review
- Participate in discussions about academic topics

QUALITY MAINTENANCE:
- Admin moderation system for flagged content
- Community-driven quality control through ratings and reviews
- Regular content audits to maintain high standards
- User reputation system based on contributions and community feedback
- Verified contributor badges for trusted uploaders

GUIDELINES:
- Upload only legitimate educational and academic materials
- Respect copyright and intellectual property rights
- Use accurate, descriptive titles and complete metadata
- Provide fair and constructive ratings and reviews
- Report spam, inappropriate, or copyright-violating content
- Maintain a respectful, supportive learning environment"""
            },
            {
                "id": "technical_and_accessibility",
                "content": """Scholara Collective technical features and accessibility:

TECHNICAL STACK:
- Frontend: React with responsive Tailwind CSS design
- Backend: Node.js with Express.js API framework
- Database: MongoDB Atlas for scalable cloud storage
- File Storage: Secure multer-based file handling with validation
- Search: MongoDB text indexing and elasticlunr for efficient resource discovery
- Authentication: JWT-based security with Google OAuth integration
- Analytics: Chart.js for usage insights and dashboard metrics

ACCESSIBILITY & SUPPORT:
- Mobile-responsive design for access on all devices
- Multi-language support (English, Hindi, Spanish) with i18next
- RTL (Right-to-Left) text support for Arabic and similar languages
- Screen reader compatibility and keyboard navigation
- High contrast mode and accessibility-compliant design
- Fast loading times and optimized performance
- Cross-browser compatibility for wide accessibility

SECURITY:
- Encrypted data storage and transmission
- GDPR-compliant data handling and user privacy controls
- Validated file uploads with security scanning
- Regular security updates and monitoring
- User-controlled privacy settings and data management"""
            },
            {
                "id": "getting_help_and_support",
                "content": """Getting help and support on Scholara Collective:

IMMEDIATE HELP:
1. AI Chatbot: Use our intelligent chatbot for instant answers about platform features, how-to questions, and academic topics
2. FAQ Section: Check comprehensive frequently asked questions covering common platform usage scenarios
3. Help Documentation: Access detailed guides for uploading, searching, and using all platform features

COMMUNITY SUPPORT:
- Community Forums: Connect with other students and contributors for peer support and academic discussions  
- User Comments: Learn from other users' experiences through resource reviews and comments
- Social Learning: Participate in collaborative learning through ratings, discussions, and knowledge sharing

TECHNICAL SUPPORT:
- Contact Support: Reach our support team through the help page for technical issues or account problems
- Bug Reports: Report technical issues or suggest new features through our GitHub repository
- Feature Requests: Contribute ideas for platform improvements through community feedback channels

STAYING UPDATED:
- Follow our social media channels for platform updates, tips, and community highlights
- Subscribe to notifications for new resources matching your academic interests
- Join our mailing list for important announcements and feature updates

Our goal is to ensure every student can successfully use Scholara Collective to enhance their learning experience."""
            },
            {
                "id": "open_source_and_contribution",
                "content": """Scholara Collective as an open-source educational platform:

OPEN SOURCE COMMITMENT:
- Complete source code available on GitHub under open-source license
- Community-driven development welcoming contributions from developers worldwide
- Transparent development process with public roadmap and feature discussions
- Educational codebase serving as learning resource for MERN stack development

WAYS TO CONTRIBUTE:
- Code Contributions: Submit bug fixes, new features, or improvements via GitHub pull requests
- Content Moderation: Help maintain platform quality through community moderation
- Translation: Contribute language translations to make the platform globally accessible
- Documentation: Improve user guides, technical documentation, and help resources
- Testing: Help identify bugs and usability issues across different devices and browsers
- Community Building: Share the platform with academic institutions and student communities

DEVELOPMENT IMPACT:
- Skill Development: Contributors gain experience with modern web technologies (MERN stack)
- Portfolio Building: Open-source contributions enhance developer portfolios and resumes
- Community Impact: Direct contribution to global educational accessibility and student success
- Collaborative Learning: Work with international developers on meaningful educational technology

The platform's open-source nature ensures it remains free, continuously improved, and accessible to students worldwide regardless of economic circumstances."""
            }
        ]
        
        # Create or load system knowledge database
        try:
            # Use a separate directory for system knowledge
            system_persist_dir = "./system_knowledge_db"
            
            if os.path.exists(system_persist_dir) and os.listdir(system_persist_dir):
                # Load existing system knowledge
                self.system_db = Chroma(
                    persist_directory=system_persist_dir,
                    embedding_function=self.embeddings
                )
                print("✅ Loaded existing Scholara system knowledge")
            else:
                # Create new system knowledge base
                documents = []
                metadatas = []
                
                for item in scholara_knowledge:
                    documents.append(item["content"])
                    metadatas.append({
                        "source": f"scholara_system_{item['id']}",
                        "type": "system_knowledge",
                        "category": "platform_info",
                        "knowledge_id": item['id']
                    })
                
                self.system_db = Chroma.from_texts(
                    documents,
                    self.embeddings,
                    metadatas=metadatas,
                    persist_directory=system_persist_dir
                )
                self.system_db.persist()
                print("✅ Created Scholara system knowledge base with comprehensive platform information")
                
        except Exception as e:
            print(f"❌ Error setting up system knowledge: {e}")

    def search_system_knowledge(self, query, k=3):
        """Search Scholara system knowledge"""
        if not self.system_db:
            return []
        
        try:
            docs = self.system_db.similarity_search(query, k=k)
            return docs
        except Exception as e:
            print(f"❌ Error searching system knowledge: {e}")
            return []

    def search_user_documents(self, query, k=3):
        """Search user-uploaded documents"""
        if not self.user_docs_db:
            return []
        
        try:
            docs = self.user_docs_db.similarity_search(query, k=k)
            return docs
        except Exception as e:
            print(f"❌ Error searching user documents: {e}")
            return []

    def is_platform_related_query(self, query):
        """Determine if query is about Scholara platform itself"""
        platform_keywords = [
            'scholara', 'collective', 'paperpal', 'platform', 'site', 'website', 'upload', 'download',
            'how to use', 'features', 'account', 'login', 'register', 'signup', 'preview',
            'search', 'filter', 'community', 'rating', 'comment', 'what is this', 'about this site',
            'help', 'support', 'faq', 'how does', 'purpose', 'about', 'what is', 'free',
            'open source', 'mern stack', 'github', 'contribute', 'accessibility'
        ]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in platform_keywords)

    def get_comprehensive_response(self, query):
        """Get response combining system knowledge and user documents"""
        
        # Check if it's a platform-related query
        is_platform_query = self.is_platform_related_query(query)
        
        # Search both knowledge bases
        system_docs = self.search_system_knowledge(query, k=2)
        user_docs = []
        
        # For academic queries or mixed queries, also search user documents
        if not is_platform_query or any(word in query.lower() for word in ['study', 'learn', 'academic', 'notes', 'papers']):
            user_docs = self.search_user_documents(query, k=3)
        
        # Prepare context
        system_context = "\n\n".join([doc.page_content for doc in system_docs])
        user_context = "\n\n".join([doc.page_content for doc in user_docs])
        
        # Choose appropriate template based on available context
        if is_platform_query and system_context:
            # Platform-specific query with system knowledge
            template = """You are the official AI assistant for Scholara Collective, a free academic resource sharing platform.

SCHOLARA PLATFORM INFORMATION:
{system_context}

USER QUESTION: {query}

Based on the platform information above, provide a helpful, informative response about Scholara Collective. Be friendly, detailed, and guide users on how to effectively use the platform. If they're asking about specific features, explain them clearly with step-by-step instructions when helpful:"""
            
            prompt = PromptTemplate(template=template, input_variables=["system_context", "query"])
            response = prompt | self.chat_model
            result = response.invoke({"system_context": system_context, "query": query})
            
            return {
                "answer": result.content,
                "sources": system_docs,
                "strategy": "platform_knowledge"
            }
            
        elif user_context and system_context:
            # Mixed query - both platform and document content
            template = """You are the AI assistant for Scholara Collective, a free academic resource sharing platform.

PLATFORM INFORMATION:
{system_context}

ACADEMIC RESOURCES FROM COMMUNITY:
{user_context}

USER QUESTION: {query}

Provide a comprehensive answer using both the platform information and academic resources above. If the question relates to using Scholara Collective, focus on platform guidance. For academic content questions, use the community-shared resources while mentioning these materials come from our collaborative learning community:"""
            
            prompt = PromptTemplate(template=template, input_variables=["system_context", "user_context", "query"])
            response = prompt | self.chat_model
            result = response.invoke({
                "system_context": system_context, 
                "user_context": user_context, 
                "query": query
            })
            
            return {
                "answer": result.content,
                "sources": system_docs + user_docs,
                "strategy": "hybrid_knowledge"
            }
            
        elif user_context:
            # Academic query with user documents only
            template = """You are the AI assistant for Scholara Collective, helping students with academic questions.

ACADEMIC RESOURCES FROM COMMUNITY:
{user_context}

USER QUESTION: {query}

Provide an educational answer based on the academic resources above from our community-shared materials. These resources have been contributed by students and educators on the Scholara Collective platform to help with collaborative learning:"""
            
            prompt = PromptTemplate(template=template, input_variables=["user_context", "query"])
            response = prompt | self.chat_model
            result = response.invoke({"user_context": user_context, "query": query})
            
            return {
                "answer": result.content,
                "sources": user_docs,
                "strategy": "academic_resources"
            }
            
        else:
            # General knowledge fallback
            template = """You are the AI assistant for Scholara Collective, a free academic resource sharing platform.

The user asked: {query}

This question isn't directly covered by our platform resources or community-uploaded documents, but I can provide a helpful educational answer using general knowledge. If relevant, I can mention how Scholara Collective's community resources and collaborative learning features might help them find more detailed materials on this topic.

Provide a comprehensive, educational response:"""
            
            prompt = PromptTemplate(template=template, input_variables=["query"])
            response = prompt | self.chat_model
            result = response.invoke({"query": query})
            
            return {
                "answer": result.content,
                "sources": [],
                "strategy": "general_knowledge"
            }


# Global variables
knowledge_manager = None
user_qa_chain = None

def setup_knowledge_system():
    """Initialize the comprehensive knowledge system"""
    global knowledge_manager
    try:
        knowledge_manager = ScholaraKnowledgeManager(embeddings, chat_model)
        
        # Connect user documents database
        user_db = get_chroma_db(embeddings)
        knowledge_manager.user_docs_db = user_db
        
        print("✅ Scholara Collective knowledge system initialized successfully")
        print("📚 System Knowledge: Platform info, features, FAQ")
        print("📄 User Documents: Community-uploaded academic resources")
        print("🧠 General Knowledge: Fallback for any other questions")
        
    except Exception as e:
        print(f"❌ Error setting up knowledge system: {e}")


def setup_legacy_qa_chain():
    """Setup legacy QA chain for backward compatibility"""
    global user_qa_chain
    db = get_chroma_db(embeddings)
    if db:
        print("⚡ Setting up legacy QA chain for user documents...")
        retriever = db.as_retriever(search_kwargs={"k": 5})

        def enhanced_hybrid_chain(inputs):
            question = inputs["query"]
            
            # Enhanced retrieval
            docs = get_enhanced_retrieval(retriever, question)
            context_text = "\n\n".join([d.page_content for d in docs]) if docs else "No relevant documents."
            
            # Evaluate context quality
            context_score = evaluate_context_quality(context_text, question)
            
            # Choose template based on context quality
            if context_score >= 3:
                template = context_rich_template
            else:
                template = general_knowledge_template
            
            qa_prompt = PromptTemplate(template=template, input_variables=["context", "question"])
            llm_chain = qa_prompt | chat_model
            
            response = llm_chain.invoke({"context": context_text, "question": question})
            
            return {
                "result": response.content,
                "source_documents": docs,
                "context_score": context_score,
                "strategy_used": "context_rich" if context_score >= 3 else "general_knowledge"
            }

        user_qa_chain = enhanced_hybrid_chain
        print("✅ Legacy QA chain configured.")
    else:
        user_qa_chain = None
        print("⚠️ ChromaDB not initialized. Cannot set up legacy QA chain.")


# Legacy templates for backward compatibility
context_rich_template = """You are an intelligent assistant helping users with information from a collaborative knowledge platform.

KNOWLEDGE INTEGRATION INSTRUCTIONS:
- You have access to specific documents and resources uploaded by users on this platform
- Combine the provided context with your general knowledge to give comprehensive answers
- When platform resources are relevant, prioritize and integrate them naturally with your knowledge
- Provide detailed, educational responses that feel natural and complete

PLATFORM CONTEXT:
{context}

USER QUESTION: {question}

Provide a comprehensive answer that naturally integrates the platform resources with relevant general knowledge:"""

general_knowledge_template = """You are an intelligent assistant on a collaborative knowledge platform.

The user asked a question that isn't directly covered by the uploaded resources on our platform, but you can still provide valuable information from your general knowledge.

USER QUESTION: {question}

AVAILABLE PLATFORM CONTEXT (limited relevance):
{context}

Provide a helpful, comprehensive answer using your knowledge. If any of the platform context is somewhat relevant, weave it in naturally:"""

def evaluate_context_quality(context, question):
    """Evaluate how relevant the retrieved context is to the question"""
    if not context or context.strip() == "No relevant documents.":
        return 1
    
    try:
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

        eval_prompt = PromptTemplate(
            template=context_evaluation_template, 
            input_variables=["context", "question"]
        )
        eval_chain = eval_prompt | chat_model
        
        response = eval_chain.invoke({"context": context, "question": question})
        relevance_score = int(response.content.strip())
        return min(max(relevance_score, 1), 5)
    except:
        return 3

def get_enhanced_retrieval(retriever, question, k=5):
    """Enhanced retrieval with multiple strategies"""
    try:
        docs = retriever.get_relevant_documents(question)
        
        if len(docs) < 2:
            key_terms = question.lower().split()
            broader_query = " ".join([term for term in key_terms if len(term) > 3])
            if broader_query and broader_query != question.lower():
                broader_docs = retriever.get_relevant_documents(broader_query)
                docs.extend(broader_docs)
        
        # Remove duplicates
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


# Enhanced query classification
def classify_query_intent(query):
    """Use LLM to classify query intent"""
    classification_prompt = PromptTemplate(
        template="""Analyze this user input and classify it into ONE category:

CASUAL: Simple greetings, small talk, polite conversation (hello, how are you, thanks, bye, etc.)
PLATFORM: Questions about Scholara Collective platform, features, how to use the site, uploading, downloading
ACADEMIC: Questions about academic subjects, study materials, educational content, homework help
UNCLEAR: Ambiguous requests that need clarification

Examples:
- "hello" -> CASUAL
- "how do I upload a PDF?" -> PLATFORM  
- "what is machine learning?" -> ACADEMIC
- "explain photosynthesis" -> ACADEMIC
- "what is this site about?" -> PLATFORM
- "how to download resources?" -> PLATFORM

User input: "{query}"

Respond with ONLY the category (CASUAL, PLATFORM, ACADEMIC, or UNCLEAR):""",
        input_variables=["query"]
    )
    
    try:
        chain = classification_prompt | chat_model
        response = chain.invoke({"query": query})
        intent = response.content.strip().upper()
        
        if intent in ['CASUAL', 'PLATFORM', 'ACADEMIC', 'UNCLEAR']:
            return intent
        return 'ACADEMIC'  # Default fallback
            
    except Exception as e:
        print(f"❌ Error in classification: {e}")
        return 'ACADEMIC'


def generate_casual_response_with_llm(query):
    """Generate natural casual responses"""
    casual_prompt = PromptTemplate(
        template="""You are the friendly AI assistant for Scholara Collective, a free academic resource sharing platform.

User said: "{query}"

Respond naturally and warmly. Keep it brief (1-2 sentences), friendly, and offer to help with platform questions or academic topics. Mention that Scholara Collective is here to help with their academic journey:""",
        input_variables=["query"]
    )
    
    try:
        chain = casual_prompt | chat_model
        response = chain.invoke({"query": query})
        return response.content.strip()
    except Exception as e:
        return "Hello! I'm here to help you with Scholara Collective and answer any academic questions. What would you like to know?"


# Initialize systems
setup_knowledge_system()
setup_legacy_qa_chain()


# -------------------------------
# Flask Routes
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
        # Refresh the knowledge system after adding new documents
        setup_knowledge_system()
        setup_legacy_qa_chain()
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

    user_query = user_query.strip()
    print(f"❓ User query: {user_query}")

    # Classify query intent
    query_intent = classify_query_intent(user_query)
    print(f"🎯 Query intent: {query_intent}")

    try:
        # Handle based on intent
        if query_intent == 'CASUAL':
            casual_response = generate_casual_response_with_llm(user_query)
            return jsonify({
                "answer": casual_response,
                "source_documents": [],
                "strategy_used": "casual_conversation",
                "query_intent": "casual"
            }), 200
        
        elif query_intent == 'UNCLEAR':
            unclear_response = """I'd be happy to help! Could you please clarify what you're looking for? 

I can assist you with:
• Questions about using Scholara Collective (uploading, downloading, searching resources)
• Academic questions using our community-shared study materials
• General educational topics and learning support

What specific information would you like to know more about?"""
            
            return jsonify({
                "answer": unclear_response,
                "source_documents": [],
                "strategy_used": "clarification_needed",
                "query_intent": "unclear"
            }), 200

        else:
            # PLATFORM or ACADEMIC queries - use enhanced knowledge manager
            if knowledge_manager:
                result = knowledge_manager.get_comprehensive_response(user_query)
                
                # Format source documents
                source_docs = []
                for doc in result['sources']:
                    source_docs.append({
                        "source": doc.metadata.get('source', 'Unknown'),
                        "type": doc.metadata.get('type', 'unknown'),
                        "content_preview": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
                    })
                
                return jsonify({
                    "answer": result['answer'],
                    "source_documents": source_docs,
                    "strategy_used": result['strategy'],
                    "query_intent": query_intent.lower()
                }), 200
            
            # Fallback to legacy system if knowledge manager fails
            elif user_qa_chain:
                print("🔄 Falling back to legacy QA chain")
                result = user_qa_chain({"query": user_query})
                
                response_data = {
                    "answer": result['result'],
                    "source_documents": [],
                    "strategy_used": result.get('strategy_used', 'legacy'),
                    "query_intent": query_intent.lower()
                }

                for doc in result['source_documents']:
                    response_data['source_documents'].append({
                        "source": doc.metadata.get('source', 'Unknown Document'),
                        "text_hash": doc.metadata.get('text_hash', 'N/A'),
                        "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    })

                return jsonify(response_data), 200
                
            else:
                # Pure general knowledge fallback
                print("🧠 Using pure general knowledge fallback")
                general_prompt = PromptTemplate(
                    template="""You are the AI assistant for Scholara Collective, a free academic resource sharing platform.

The user asked: {question}

Currently, there are no specific documents or platform resources available that directly relate to this question, but I can provide a helpful educational answer using general knowledge. If this is an academic question, I can suggest how Scholara Collective's community resources might help them find more detailed study materials.

Provide a comprehensive, helpful response:""",
                    input_variables=["question"]
                )
                
                general_chain = general_prompt | chat_model
                response = general_chain.invoke({"question": user_query})
                
                return jsonify({
                    "answer": response.content,
                    "source_documents": [],
                    "strategy_used": "pure_general_knowledge",
                    "query_intent": query_intent.lower()
                }), 200
            
    except Exception as e:
        print(f"❌ Error processing query: {e}")
        return jsonify({"error": "An error occurred while processing your query. Please try again."}), 500


@app.route('/stats', methods=['GET'])
def get_stats():
    """Get platform statistics"""
    try:
        user_db = get_chroma_db(embeddings)
        system_docs = 0
        user_docs = 0
        
        if user_db:
            collection = user_db._collection
            user_docs = collection.count()
        
        if knowledge_manager and knowledge_manager.system_db:
            system_collection = knowledge_manager.system_db._collection
            system_docs = system_collection.count()
            
        return jsonify({
            "total_user_documents": user_docs,
            "system_knowledge_items": system_docs,
            "status": "operational",
            "knowledge_system_ready": knowledge_manager is not None,
            "legacy_qa_ready": user_qa_chain is not None
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting stats: {e}")
        return jsonify({
            "total_user_documents": 0,
            "system_knowledge_items": 0,
            "status": "error",
            "knowledge_system_ready": False,
            "legacy_qa_ready": False
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with detailed system status"""
    system_status = {
        "status": "healthy",
        "knowledge_manager_ready": knowledge_manager is not None,
        "embeddings_loaded": embeddings is not None,
        "chat_model_ready": chat_model is not None,
        "system_knowledge_loaded": knowledge_manager and knowledge_manager.system_db is not None,
        "user_docs_connected": knowledge_manager and knowledge_manager.user_docs_db is not None,
        "timestamp": "2025-08-30"
    }
    
    return jsonify(system_status), 200


@app.route('/refresh-system', methods=['POST'])
def refresh_system_knowledge():
    """Endpoint to refresh/rebuild system knowledge (admin use)"""
    try:
        # Reinitialize the knowledge system
        setup_knowledge_system()
        setup_legacy_qa_chain()
        
        return jsonify({
            "message": "System knowledge refreshed successfully",
            "status": "success"
        }), 200
        
    except Exception as e:
        print(f"❌ Error refreshing system: {e}")
        return jsonify({
            "error": "Failed to refresh system knowledge",
            "status": "error"
        }), 500


@app.route('/test-query', methods=['POST'])
def test_query():
    """Test endpoint for debugging different query types"""
    data = request.json
    test_query = data.get('query')
    
    if not test_query:
        return jsonify({"error": "Missing test query"}), 400
    
    try:
        # Get intent classification
        intent = classify_query_intent(test_query)
        
        # Get platform relevance check
        is_platform = knowledge_manager.is_platform_related_query(test_query) if knowledge_manager else False
        
        # Get sample results from both knowledge bases
        system_results = knowledge_manager.search_system_knowledge(test_query, k=1) if knowledge_manager else []
        user_results = knowledge_manager.search_user_documents(test_query, k=1) if knowledge_manager else []
        
        return jsonify({
            "test_query": test_query,
            "classified_intent": intent,
            "is_platform_related": is_platform,
            "system_knowledge_found": len(system_results),
            "user_documents_found": len(user_results),
            "system_sample": system_results[0].page_content[:100] + "..." if system_results else "No results",
            "user_sample": user_results[0].page_content[:100] + "..." if user_results else "No results"
        }), 200
        
    except Exception as e:
        print(f"❌ Error in test query: {e}")
        return jsonify({"error": "Test query failed"}), 500


if __name__ == '__main__':
    print("🚀 Starting Scholara Collective AI Assistant...")
    print("📚 System Features:")
    print("   • Scholara platform knowledge (FAQ, features, guides)")
    print("   • Community academic resources (user-uploaded PDFs)")
    print("   • General knowledge fallback")
    print("   • Smart intent classification")
    print("   • Casual conversation handling")
    print("🌟 Ready to help students with platform usage and academic questions!")
    app.run(host='0.0.0.0', port=8000, debug=True)