import os
from langchain.docstore.document import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

# --- Configuration ---
CHROMA_DB_PATH = "./chroma_db"

def get_chroma_db(embeddings):
    """Loads or creates the ChromaDB instance."""
    if os.path.exists(CHROMA_DB_PATH) and os.listdir(CHROMA_DB_PATH):
        print(f"Loading existing ChromaDB from {CHROMA_DB_PATH}...")
        try:
            db = Chroma(persist_directory=CHROMA_DB_PATH, embedding_function=embeddings)
            print("ChromaDB loaded successfully.")
            return db
        except Exception as e:
            print(f"Error loading ChromaDB: {e}")
            print("Ensure the embeddings function used here matches the one used during DB creation.")
            return None
    else:
        print(f"ChromaDB not found or empty at {CHROMA_DB_PATH}. A new one will be created upon first document processing.")
        return None

def process_document_and_add_to_db(document_title, text_content, text_hash, embeddings):
    """
    Processes text content, chunks it, and adds it to ChromaDB.
    This is the core function to be called on new file uploads.
    """
    try:
        if not text_content.strip():
            print(f"Warning: No readable text content provided for '{document_title}'. Skipping.")
            return

        # Create a LangChain Document with metadata
        document = Document(page_content=text_content, metadata={"source": document_title, "text_hash": text_hash})
        
        # Document Chunking
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            is_separator_regex=False,
        )
        chunks = text_splitter.split_documents([document])
        
        if not chunks:
            print(f"Warning: No chunks generated for '{document_title}'. Skipping this document.")
            return

        print(f"Text extracted and split into {len(chunks)} chunks for '{document_title}'.")
        
        # Get the ChromaDB instance
        db = get_chroma_db(embeddings)
        if db is None:
            # If the DB doesn't exist, create it from this first set of chunks
            db = Chroma.from_documents(chunks, embeddings, persist_directory=CHROMA_DB_PATH)
            print(f"New ChromaDB created with documents from '{document_title}'.")
        else:
            # If the DB exists, add the new documents to it
            db.add_documents(chunks)
            print(f"New chunks from '{document_title}' added to existing ChromaDB.")
            
    except Exception as e:
        print(f"An unexpected error occurred while processing '{document_title}': {e}.")

if __name__ == '__main__':
    print("This file is a module to be imported. The main block is for testing.")
