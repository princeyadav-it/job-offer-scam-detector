"""
PDF Report Generation for Offer Letter Verification Results
This module generates a detailed, colorful PDF report with all analysis findings.
"""

import os
import sys
import json
from datetime import datetime

# Try to import reportlab
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def generate_pdf_report(result_data, output_path=None):
    """Generate a detailed PDF report with full analysis."""
    
    if not REPORTLAB_AVAILABLE:
        return generate_text_report(result_data, output_path)
    
    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), "..", "uploads", f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = SimpleDocTemplate(output_path, pagesize=letter, topMargin=30, bottomMargin=30)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=26,
        spaceAfter=20,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=25,
        textColor=colors.HexColor('#64748b'),
        alignment=TA_CENTER
    )
    
    section_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=8,
        textColor=colors.HexColor('#334155')
    )
    
    # ========== TITLE ==========
    story.append(Paragraph("🔍 AI Offer Letter Verification Report", title_style))
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
    story.append(Spacer(1, 10))
    
    # ========== VERIFICATION SUMMARY ==========
    story.append(Paragraph("📋 VERIFICATION SUMMARY", section_style))
    
    status = result_data.get('status', 'Unknown')
    risk = result_data.get('risk', 'Unknown')
    confidence = result_data.get('confidence', 0)
    
    # Status colors
    if status == 'Genuine':
        status_color = '#22c55e'
        status_icon = '✅'
    elif status == 'Suspected':
        status_color = '#f59e0b'
        status_icon = '⚠️'
    else:
        status_color = '#ef4444'
        status_icon = '❌'
    
    summary_data = [
        ['Status', 'Risk Level', 'Confidence'],
        [f"{status_icon} {status}", f"🔴 {risk}", f"🔥 {confidence}%"]
    ]
    
    summary_table = Table(summary_data, colWidths=[150, 150, 120])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#f1f5f9')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, 1), [colors.HexColor('#f8fafc')])
    ]))
    
    story.append(summary_table)
    
    # ========== DOMAIN ANALYSIS ==========
    story.append(Paragraph("🌐 DOMAIN ANALYSIS", section_style))
    
    domain_check = result_data.get('domain_check', {})
    detailed = result_data.get('detailed_analysis', {})
    
    if domain_check and domain_check.get('found'):
        domains = domain_check.get('domains', [])
        is_legit = domain_check.get('is_legitimate', False)
        is_susp = domain_check.get('is_suspicious', False)
        
        # Domain status
        if is_legit:
            domain_status = "✅ Verified Legitimate"
            domain_bg = '#dcfce7'
        elif is_susp:
            domain_status = "⚠️ Suspicious"
            domain_bg = '#fef9c3'
        else:
            domain_status = "❓ Unknown"
            domain_bg = '#f1f5f9'
        
        domain_data = [
            ['Analysis', 'Result'],
            ['📧 Domain Found', domains[0] if domains else 'N/A'],
            ['🎯 Status', domain_status],
            ['✅ Is Legitimate Company', 'Yes' if is_legit else 'No'],
            ['❌ Is Suspicious', 'Yes' if is_susp else 'No'],
            ['💡 Reason', domain_check.get('reason', 'No reason')]
        ]
        
        domain_table = Table(domain_data, colWidths=[180, 250])
        domain_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]))
        
        story.append(domain_table)
    else:
        story.append(Paragraph("❌ No company email domain found in the document", normal_style))
    
    story.append(Spacer(1, 15))
    
    # ========== ML MODEL ANALYSIS ==========
    story.append(Paragraph("🔎 ML MODEL ANALYSIS", section_style))
    
    if detailed:
        ml_pred = detailed.get('ml_prediction', 'N/A')
        ml_conf = detailed.get('ml_confidence', 0)
        scam_kw = detailed.get('scam_keywords_found', [])
        susp_phrases = detailed.get('suspicious_phrases_found', [])
        
        # Format scam keywords
        scam_kw_text = '✅ None' if not scam_kw else '❌ ' + ', '.join(scam_kw)
        susp_text = '✅ None' if not susp_phrases else '❌ ' + ', '.join(susp_phrases)
        
        ml_data = [
            ['Check', 'Result'],
            ['🤖 ML Model Prediction', ml_pred if ml_pred else 'N/A'],
            ['📊 ML Model Confidence', f"{ml_conf}%"],
            ['🚨 Scam Keywords Found', scam_kw_text],
            ['⚠️ Suspicious Phrases', susp_text]
        ]
        
        ml_table = Table(ml_data, colWidths=[180, 250])
        ml_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]))
        
        story.append(ml_table)
    else:
        story.append(Paragraph("No ML analysis available", normal_style))
    
    story.append(Spacer(1, 15))
    
    # ========== ANALYSIS FINDINGS ==========
    story.append(Paragraph("📝 DETAILED FINDINGS", section_style))
    
    reasons = result_data.get('reasons', [])
    if reasons:
        for i, reason in enumerate(reasons, 1):
            story.append(Paragraph(f"• {reason}", normal_style))
    else:
        story.append(Paragraph("No specific findings available", normal_style))
    
    # Add confidence explanation
    story.append(Spacer(1, 15))
    story.append(Paragraph("📈 CONFIDENCE EXPLANATION", section_style))
    
    conf_explanation = f"""
    The overall confidence is {confidence}%. This is calculated based on:
    <br/><br/>
    • Domain verification: {'Verified legitimate company domain' if domain_check.get('is_legitimate') else 'Not verified or suspicious'}
    <br/>
    • ML Model confidence: {detailed.get('ml_confidence', 0)}%
    <br/>
    • Scam keywords found: {len(scam_kw) if detailed else 0}
    <br/>
    • Suspicious phrases: {len(susp_phrases) if detailed else 0}
    """
    story.append(Paragraph(conf_explanation, normal_style))
    
    story.append(Spacer(1, 25))
    
    # ========== DISCLAIMER ==========
    story.append(Paragraph("⚠️ IMPORTANT DISCLAIMER", section_style))
    disclaimer = """
    This report is generated by an AI-based system and should be used as a preliminary screening tool only. 
    It does NOT guarantee the authenticity of the offer letter. 
    <br/><br/>
    <b>Always:</b>
    <br/>• Verify company details through official company websites
    <br/>• Check company registration with government authorities
    <br/>• Contact the company directly using official contact information
    <br/>• Consult with career advisors or professionals
    <br/><br/>
    <b>Stay Safe:</b> Never send money or provide personal banking details to unknown employers.
    """
    story.append(Paragraph(disclaimer, normal_style))
    
    story.append(Spacer(1, 20))
    
    # ========== FOOTER ==========
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#94a3b8'),
        alignment=TA_CENTER
    )
    story.append(Paragraph("—" * 40, footer_style))
    story.append(Paragraph("AI Offer Letter Verifier | Generated by Machine Learning", footer_style))
    story.append(Paragraph(f"Report ID: {datetime.now().strftime('%Y%m%d%H%M%S')}", footer_style))
    
    # Build PDF
    doc.build(story)
    
    return output_path


def generate_text_report(result_data, output_path=None):
    """Generate text report as fallback."""
    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), "..", "uploads", f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("🔍 AI OFFER LETTER VERIFICATION REPORT\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("📋 VERIFICATION SUMMARY\n")
        f.write("-" * 40 + "\n")
        f.write(f"Status: {result_data.get('status', 'Unknown')}\n")
        f.write(f"Risk: {result_data.get('risk', 'Unknown')}\n")
        f.write(f"Confidence: {result_data.get('confidence', 0)}%\n\n")
        
        f.write("🌐 DOMAIN ANALYSIS\n")
        f.write("-" * 40 + "\n")
        dc = result_data.get('domain_check', {})
        if dc:
            f.write(f"Domain Found: {dc.get('domains', [])}\n")
            f.write(f"Is Legitimate: {dc.get('is_legitimate', False)}\n")
            f.write(f"Is Suspicious: {dc.get('is_suspicious', False)}\n")
            f.write(f"Reason: {dc.get('reason', 'N/A')}\n")
        else:
            f.write("No domain analysis available\n")
        f.write("\n")
        
        f.write("🔎 ML MODEL ANALYSIS\n")
        f.write("-" * 40 + "\n")
        da = result_data.get('detailed_analysis', {})
        if da:
            f.write(f"ML Prediction: {da.get('ml_prediction', 'N/A')}\n")
            f.write(f"ML Confidence: {da.get('ml_confidence', 0)}%\n")
            f.write(f"Scam Keywords: {da.get('scam_keywords_found', [])}\n")
            f.write(f"Suspicious Phrases: {da.get('suspicious_phrases_found', [])}\n")
        f.write("\n")
        
        f.write("📝 FINDINGS\n")
        f.write("-" * 40 + "\n")
        for r in result_data.get('reasons', []):
            f.write(f"• {r}\n")
        
        f.write("\n⚠️ DISCLAIMER\n")
        f.write("-" * 40 + "\n")
        f.write("This is AI-generated. Verify independently.\n")
    
    return output_path


if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            result_data = json.loads(sys.argv[1])
            output = generate_pdf_report(result_data)
            print(output)
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)
    else:
        # Test
        test_data = {
            "status": "Genuine",
            "risk": "Low",
            "confidence": 95,
            "reasons": [
                "Company email domain verified: microsoft.com",
                "Standard salary structure",
                "Proper documentation format"
            ],
            "domain_check": {
                "found": True,
                "domains": ["microsoft.com"],
                "is_legitimate": True,
                "is_suspicious": False,
                "reason": "Company email domain verified: microsoft.com"
            },
            "detailed_analysis": {
                "ml_prediction": "Genuine",
                "ml_confidence": 85.5,
                "scam_keywords_found": [],
                "suspicious_phrases_found": []
            }
        }
        output = generate_pdf_report(test_data)
        print(f"Test: {output}")
