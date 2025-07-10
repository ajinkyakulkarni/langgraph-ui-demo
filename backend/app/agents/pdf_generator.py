from typing import Dict, Any, AsyncIterator
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
import base64
from datetime import datetime

from app.agents.base import BaseAgent

class PDFGeneratorAgent(BaseAgent):
    async def process(self, input_data: Any) -> AsyncIterator[Dict[str, Any]]:
        yield {"status": "generating", "message": "Creating PDF report..."}
        
        # Extract data from input
        title = input_data.get("title", "Research Report")
        sections = input_data.get("sections", [])
        metadata = input_data.get("metadata", {})
        
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center
        )
        story.append(Paragraph(title, title_style))
        story.append(Spacer(1, 0.5*inch))
        
        # Metadata
        if metadata:
            story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
            if 'author' in metadata:
                story.append(Paragraph(f"Author: {metadata['author']}", styles['Normal']))
            story.append(Spacer(1, 0.3*inch))
        
        # Sections
        for section in sections:
            # Section title
            if 'title' in section:
                story.append(Paragraph(section['title'], styles['Heading2']))
                story.append(Spacer(1, 0.2*inch))
            
            # Section content
            if 'content' in section:
                # Handle different content types
                content = section['content']
                if isinstance(content, str):
                    paragraphs = content.split('\n\n')
                    for para in paragraphs:
                        story.append(Paragraph(para, styles['Normal']))
                        story.append(Spacer(1, 0.1*inch))
                elif isinstance(content, list):
                    for item in content:
                        story.append(Paragraph(f"• {item}", styles['Normal']))
                    story.append(Spacer(1, 0.1*inch))
            
            # Section data (papers, code, etc.)
            if 'data' in section:
                data = section['data']
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict):
                            # Format based on item type
                            if 'title' in item:  # Paper
                                story.append(Paragraph(f"<b>{item['title']}</b>", styles['Normal']))
                                if 'authors' in item:
                                    story.append(Paragraph(f"Authors: {', '.join(item['authors'])}", styles['Normal']))
                                if 'summary' in item:
                                    story.append(Paragraph(item['summary'][:200] + "...", styles['Normal']))
                                story.append(Spacer(1, 0.1*inch))
        
        # Build PDF
        doc.build(story)
        
        # Get PDF bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        # Convert to base64 for transmission
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        yield {
            "status": "completed",
            "pdf_base64": pdf_base64,
            "filename": f"{title.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
            "message": "PDF report generated successfully"
        }