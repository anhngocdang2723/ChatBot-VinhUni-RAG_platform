from sentence_transformers import SentenceTransformer, CrossEncoder
import logging
import torch

logger = logging.getLogger(__name__)

class ModelSingleton:
    _instance = None
    _embedding_model = None
    _reranking_model = None
    _device = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        if ModelSingleton._device is None:
            # Check CUDA availability once
            ModelSingleton._device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Using device: {ModelSingleton._device}")

        if ModelSingleton._embedding_model is None:
            logger.info("Initializing document embedding model (this should happen only once)")
            ModelSingleton._embedding_model = SentenceTransformer('dangvantuan/vietnamese-embedding')
            ModelSingleton._embedding_model.to(ModelSingleton._device)
            logger.info("Embedding model initialization complete")

        if ModelSingleton._reranking_model is None:
            logger.info("Initializing reranking model (this should happen only once)")
            ModelSingleton._reranking_model = CrossEncoder('cross-encoder/mmarco-mMiniLMv2-L12-H384-v1', max_length=512)
            ModelSingleton._reranking_model.to(ModelSingleton._device)
            logger.info("Reranking model initialization complete")

    @property
    def embedding_model(self):
        return ModelSingleton._embedding_model

    @property
    def reranking_model(self):
        return ModelSingleton._reranking_model

    @property
    def device(self):
        return ModelSingleton._device

    def get_embedding_dimension(self):
        return self.embedding_model.get_sentence_embedding_dimension()

# Create the singleton instance at module load time
model_singleton = ModelSingleton.get_instance() 