"""
Multi-Provider AI Service with Automatic Fallback
Supports: OpenAI, Google Gemini, and can be extended to others
"""
import os
import json
import requests
from typing import Dict, List, Optional
from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    def generate_content(self, prompt: str) -> Dict:
        """Generate content using the AI provider"""
        pass
    
    @abstractmethod
    def get_name(self) -> str:
        """Get provider name"""
        pass


class OpenAIProvider(AIProvider):
    """OpenAI GPT provider"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://api.openai.com/v1/chat/completions"
    
    def get_name(self) -> str:
        return "OpenAI"
    
    def generate_content(self, prompt: str) -> Dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": "Eres un experto en marketing y redacción de contenido para e-commerce. Siempre respondes en formato JSON válido."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        response = requests.post(self.api_url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        return self._parse_json_response(content)
    
    def _parse_json_response(self, content: str) -> Dict:
        """Parse JSON from AI response"""
        content = content.strip()
        
        # Remove markdown code blocks
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        return json.loads(content)


class GeminiProvider(AIProvider):
    """Google Gemini provider"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}"
    
    def get_name(self) -> str:
        return "Google Gemini"
    
    def generate_content(self, prompt: str) -> Dict:
        headers = {
            "Content-Type": "application/json"
        }
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2000,
            }
        }
        
        response = requests.post(self.api_url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            content = result['candidates'][0]['content']['parts'][0]['text']
        else:
            raise Exception("No content in Gemini response")
        
        return self._parse_json_response(content)
    
    def _parse_json_response(self, content: str) -> Dict:
        """Parse JSON from AI response"""
        content = content.strip()
        
        # Remove markdown code blocks
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        return json.loads(content)


class GroqProvider(AIProvider):
    """Groq AI provider (fast and free)"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
    
    def get_name(self) -> str:
        return "Groq"
    
    def generate_content(self, prompt: str) -> Dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": "Eres un experto en marketing y redacción de contenido para e-commerce. Siempre respondes en formato JSON válido."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        response = requests.post(self.api_url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        return self._parse_json_response(content)
    
    def _parse_json_response(self, content: str) -> Dict:
        """Parse JSON from AI response"""
        content = content.strip()
        
        # Remove markdown code blocks
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        return json.loads(content)


class MultiProviderAIService:
    """AI Service with automatic fallback between providers"""
    
    def __init__(self):
        self.providers: List[AIProvider] = []
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize all available AI providers"""
        
        # Groq (FIRST - Fast and free with high limits)
        groq_keys = [
            os.getenv('GROQ_API_KEY'),
            os.getenv('GROQ_API_KEY_2'),
        ]
        
        for key in groq_keys:
            if key:
                self.providers.append(GroqProvider(key))
        
        # OpenAI
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key:
            self.providers.append(OpenAIProvider(openai_key))
        
        # Google Gemini (try multiple keys)
        gemini_keys = [
            os.getenv('GEMINI_API_KEY_1'),
            os.getenv('GEMINI_API_KEY_2'),
        ]
        
        for key in gemini_keys:
            if key:
                self.providers.append(GeminiProvider(key))
    
    def generate_product_content(self, product_name: str, ai_prompt: str = None) -> Dict:
        """
        Generate product content with automatic provider fallback
        
        Args:
            product_name: Name of the product
            ai_prompt: Specific instructions for the AI (overrides product_name if mostly consistent)
            
        Returns:
            Dictionary with generated content fields
        """
        # Use ai_prompt if provided, otherwise fallback to product_name
        prompt_input = ai_prompt if ai_prompt and ai_prompt.strip() else product_name
        
        prompt = self._build_prompt(prompt_input, product_name)
        
        errors = []
        
        # Try each provider in order
        for provider in self.providers:
            try:
                print(f"Trying {provider.get_name()}...")
                content = provider.generate_content(prompt)
                
                # Validate required fields
                required_fields = ['short_description', 'full_description', 'meta_title', 
                                 'meta_description', 'keywords', 'technical_specs']
                
                for field in required_fields:
                    if field not in content:
                        raise ValueError(f"Missing required field: {field}")
                
                print(f"✓ Success with {provider.get_name()}")
                return content
                
            except requests.exceptions.HTTPError as e:
                error_msg = f"{provider.get_name()} failed: HTTP {e.response.status_code}"
                print(error_msg)
                errors.append(error_msg)
                continue
                
            except Exception as e:
                error_msg = f"{provider.get_name()} failed: {str(e)}"
                print(error_msg)
                errors.append(error_msg)
                continue
        
        # All providers failed
        raise Exception(f"All AI providers failed. Errors: {'; '.join(errors)}")
    
    def _build_prompt(self, instructions: str, product_name: str) -> str:
        """Build the AI prompt for product content generation"""
        return f"""Genera contenido profesional para e-commerce basado en: {instructions}
(Producto: {product_name})

Debes devolver ÚNICAMENTE un JSON válido con esta estructura exacta:
{{
  "short_description": "Descripción breve (2-3 oraciones). Usa formato Markdown simple (negritas **texto** si es necesario).",
  "full_description": "Descripción completa y persuasiva. Usa formato HTML (<p>, <ul>, <li>, <strong>, <h3>) para que se vea bien en la tienda. Incluye beneficios y características.",
  "meta_title": "Título SEO optimizado (máx 60 caracteres)",
  "meta_description": "Descripción SEO (máx 160 caracteres)",
  "keywords": "palabra1, palabra2, palabra3, palabra4, palabra5",
  "technical_specs": {{
      "Material": "Ej: Madera de Roble",
      "Dimensiones": "Ej: 120 x 80 cm",
      "Peso": "Ej: 15 kg",
      "Color": "Ej: Natural"
  }}
}}

IMPORTANTE:
- Contenido en ESPAÑOL
- technical_specs debe ser un OBJETO JSON simple (Clave: Valor), NO una lista, NO un string.
- full_description debe usar etiquetas HTML para párrafos y listas.
- short_description debe ser texto plano o markdown simple.
- Devuelve SOLO el JSON.
"""


# Singleton instance (keeping same name for compatibility)
deepseek_service = MultiProviderAIService()
