class FileProcessor:
    """Handles basic file operations and validations"""
    
    def __init__(self):
        self.supported_extensions = {
            'pdf': ['pdf'],
            'document': ['doc', 'docx', 'txt', 'rtf'],
            'presentation': ['ppt', 'pptx'],
            'spreadsheet': ['xls', 'xlsx', 'csv'],
            'web': ['html', 'htm']
        }
    
    def get_file_type(self, filename: str) -> str:
        """Get file type from filename"""
        ext = filename.split('.')[-1].lower()
        for file_type, extensions in self.supported_extensions.items():
            if ext in extensions:
                return file_type
        return "unknown" 