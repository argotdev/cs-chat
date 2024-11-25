import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';


export class PineconeSystem {
    constructor(openaiApiKey, pineconeApiKey, indexName) {
      // Initialize OpenAI client
      this.openai = new OpenAI({
        apiKey: openaiApiKey
      });
  
      // Initialize Pinecone
      this.pc = new Pinecone({
        apiKey: pineconeApiKey,
      });
  
      this.indexName = indexName;
      this.index = this.pc.index(indexName);
    }    
  
    async createEmbedding(text) {
      const response = await this.openai.embeddings.create({
        input: text,
        model: "text-embedding-ada-002"
      });
      return response.data[0].embedding;
    }
  
    
  
    async querySimilar(query, topK = 3, filterDict = null) {
      try {
        const queryEmbedding = await this.createEmbedding(query);
  
        const results = await this.index.query({
          vector: queryEmbedding,
          topK,
          includeMetadata: true,
          filter: filterDict
        });
        console.log(results);
  
        return results.matches;
      } catch (error) {
        throw new Error(`Error querying similar texts: ${error.message}`);
      }
    }
  }