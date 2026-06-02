import PizZip from 'pizzip'
import { saveAs } from 'file-saver'
import { Template, FormData } from '@/lib/types'

/**
 * Generate a proper .docx file from template data
 * Uses PizZip to build a minimal Open XML document
 */
export async function exportToWord(
  template: Template,
  allFields: FormData,
  filename?: string
) {
  const zip = new PizZip()

  // [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`)

  // _rels/.rels
  zip.folder('_rels')!.file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)

  // word/_rels/document.xml.rels
  zip.folder('word')!.folder('_rels')!.file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)

  // word/styles.xml
  zip.folder('word')!.file('styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr><w:spacing w:after="120" w:line="360" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:eastAsia="宋体"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr>
    <w:rPr><w:rFonts w:eastAsia="黑体"/><w:b/><w:sz w:val="44"/><w:szCs w:val="44"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:rPr><w:rFonts w:eastAsia="黑体"/><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr><w:spacing w:before="120" w:after="80"/></w:pPr>
    <w:rPr><w:rFonts w:eastAsia="黑体"/><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>
  </w:style>
</w:styles>`)

  // Build document body
  const paragraphs: string[] = []

  // Title
  paragraphs.push(makeParagraph(template.name, 'Title'))

  // Subtitle - department info
  paragraphs.push(makeCenteredParagraph('贵州中医药大学预防医学教研室'))
  paragraphs.push(makeCenteredParagraph(`生成时间：${new Date().toLocaleString('zh-CN')}`))
  paragraphs.push(makeParagraph('', 'Normal')) // spacer

  // Sections
  template.sections.forEach((section) => {
    paragraphs.push(makeParagraph(section.title, 'Heading1'))

    section.fields.forEach((fieldKey) => {
      const field = template.fields.find((f) => f.key === fieldKey)
      if (!field) return

      const value = allFields[fieldKey] || ''
      if (!value) return

      // Field label as heading
      paragraphs.push(makeParagraph(field.label, 'Heading2'))

      // Field value - split by newlines for multi-line content
      const lines = value.split('\n')
      lines.forEach((line) => {
        if (line.trim()) {
          paragraphs.push(makeParagraph(line.trim(), 'Normal'))
        }
      })
    })
  })

  // Footer
  paragraphs.push(makeParagraph('', 'Normal'))
  paragraphs.push(makeParagraph('—'.repeat(30), 'Normal'))
  paragraphs.push(makeParagraph('本文档由「贵州中医药大学预防医学教研室文书管理系统」自动生成', 'Normal'))

  // word/document.xml
  zip.folder('word')!.file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${paragraphs.join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720"/>
    </w:sectPr>
  </w:body>
</w:document>`)

  // Generate and download
  const blob = zip.generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  const defaultFilename = `${template.name}_${new Date().toISOString().split('T')[0]}.docx`
  saveAs(blob, filename || defaultFilename)
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function makeParagraph(text: string, style: string): string {
  return `<w:p>
      <w:pPr><w:pStyle w:val="${style}"/></w:pPr>
      <w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>
    </w:p>`
}

function makeCenteredParagraph(text: string): string {
  return `<w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:eastAsia="宋体"/><w:color w:val="666666"/><w:sz w:val="22"/></w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>`
}
