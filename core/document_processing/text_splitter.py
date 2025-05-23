from langchain_text_splitters import RecursiveCharacterTextSplitter

class TextSplitter:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )

    def split_text(self, text: str) -> list[str]:
        """Split text into chunks using the configured splitter."""
        if not text:
            return []
        return self.text_splitter.split_text(text) 