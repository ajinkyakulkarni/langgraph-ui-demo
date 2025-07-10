from typing import Any, Dict
from abc import ABC, abstractmethod

class BaseGuardrail(ABC):
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    @abstractmethod
    async def validate(self, data: Any) -> Any:
        pass

class ContentFilter(BaseGuardrail):
    async def validate(self, data: Any) -> Any:
        # Filter inappropriate content
        if isinstance(data, str):
            # Simple example - in production use proper content filtering
            blocked_words = self.config.get('blocked_words', [])
            for word in blocked_words:
                if word.lower() in data.lower():
                    raise ValueError(f"Content contains blocked word: {word}")
        
        return data

class QualityCheck(BaseGuardrail):
    async def validate(self, data: Any) -> Any:
        # Check quality metrics
        min_length = self.config.get('min_length', 10)
        
        if isinstance(data, str) and len(data) < min_length:
            raise ValueError(f"Content too short. Minimum length: {min_length}")
        
        if isinstance(data, list) and len(data) == 0:
            raise ValueError("Empty results not allowed")
        
        return data

class FormatValidator(BaseGuardrail):
    async def validate(self, data: Any) -> Any:
        # Validate data format
        expected_format = self.config.get('format', 'any')
        
        if expected_format == 'json' and not isinstance(data, (dict, list)):
            raise ValueError("Expected JSON format")
        
        if expected_format == 'text' and not isinstance(data, str):
            raise ValueError("Expected text format")
        
        return data

GUARDRAIL_MAP = {
    'content_filter': ContentFilter,
    'quality_check': QualityCheck,
    'format_validator': FormatValidator,
}