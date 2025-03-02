# WP2HUGO Content Generation Process Flow

The diagram below illustrates the complete process flow of how a keyword is transformed into high-quality content with the WP2HUGO system.

```mermaid
flowchart TD
    classDef serviceClass fill:#f9f,stroke:#333,stroke-width:2px
    classDef dataClass fill:#bbf,stroke:#333,stroke-width:1px
    classDef outputClass fill:#bfb,stroke:#333,stroke-width:1px
    classDef mainProcessClass fill:#fbb,stroke:#333,stroke-width:2px,color:#000
    
    %% Input
    KW[/"Input Keyword"/] --> KWR(Keyword Research Service)
    class KW dataClass
    class KWR serviceClass
    
    %% Research Phase
    KWR --> SERPD[("SERP Data\n- Search volume\n- Related keywords\n- Competitor content")]
    SERPD --> PPLX(Perplexity Service)
    PPLX --> RSRCHD[("Research Data\n- Topic exploration\n- Market trends\n- Expert insights")]
    class SERPD dataClass
    class PPLX serviceClass
    class RSRCHD dataClass
    
    %% Intent Analysis Phase
    subgraph Intent["Search Intent Analysis"]
        direction TB
        SERPD --> INTENT(Search Intent Analyzer)
        INTENT --> INTENTD[("Intent Data\n- Primary intent\n- User journey stage\n- Content format\n- Featured snippet opportunity")]
        INTENT --> IC{{"Classify Intent\n- Informational\n- Commercial\n- Transactional\n- Navigational"}}
        INTENT --> FD{{"Format Detection\n- How-to\n- List post\n- Comparison\n- Ultimate guide"}}
        INTENT --> FSO{{"Featured Snippet\nOpportunities"}}
        INTENT --> UJM{{"User Journey\nMapping"}}
        INTENT --> QI{{"Question\nIdentification"}}
        INTENT --> HS{{"Heading Structure\nRecommendation"}}
    end
    
    class INTENT serviceClass
    class INTENTD dataClass
    class IC mainProcessClass
    class FD mainProcessClass
    class FSO mainProcessClass
    class UJM mainProcessClass
    class QI mainProcessClass
    class HS mainProcessClass
    
    %% Content Structure Phase
    INTENTD --> GAIS(Google AI Service)
    RSRCHD --> GAIS
    GAIS --> STRUCD[("Structure Data\n- Title\n- Description\n- Sections with headings\n- Content outline")]
    class GAIS serviceClass
    class STRUCD dataClass
    
    %% Content Enhancement Phase
    STRUCD --> ANTH(Anthropic Service)
    INTENTD -.-> ANTH
    ANTH --> ENHCD[("Enhanced Content\n- Detailed paragraphs\n- Examples\n- Expert quotes\n- Data points")]
    class ANTH serviceClass
    class ENHCD dataClass
    
    %% SEO Optimization Phase
    ENHCD --> SEO(SEO Quality Service)
    INTENTD -.-> SEO
    SEO --> OPTCD[("Optimized Content\n- SEO score\n- Readability score\n- Keyword density\n- Improvement suggestions")]
    class SEO serviceClass
    class OPTCD dataClass
    
    %% Image Generation
    KW --> IMG(Image Generation Service)
    INTENTD -.-> IMG
    IMG --> IMGD[("Image Data\n- Feature image URL\n- Alt text\n- Image caption")]
    class IMG serviceClass
    class IMGD dataClass
    
    %% Markdown Generation
    OPTCD --> MDG(Markdown Generator)
    IMGD --> MDG
    INTENTD -.-> MDG
    MDG --> MD[("Markdown File\n- Frontmatter\n- Formatted content\n- Image integration")]
    class MDG serviceClass
    class MD dataClass
    
    %% Hugo Export
    MD --> HUGO(Hugo Exporter)
    HUGO --> HGEXP[("Hugo Export\n- Hugo compatible files\n- Content directory structure\n- Image resources")]
    class HUGO serviceClass
    class HGEXP outputClass
    
    %% Legend
    LEGEND["Legend"]
    SERVICE["Services"]:::serviceClass
    DATA["Data"]:::dataClass
    PROC["Processes"]:::mainProcessClass
    OUT["Output"]:::outputClass
    
    %% Dashed lines indicate influence
    linkStyle 11 stroke-dasharray: 5 5
    linkStyle 13 stroke-dasharray: 5 5
    linkStyle 15 stroke-dasharray: 5 5
    linkStyle 18 stroke-dasharray: 5 5
```

## Diagram Explanation

The diagram shows the complete transformation process of a keyword into high-quality content:

1. **Input**: The process begins with a user-provided keyword.

2. **Research Phase**:
   - The keyword is sent to the Keyword Research Service.
   - SERP data is collected (search volume, related keywords, competitor content).
   - The Perplexity Service gathers additional research data.

3. **Search Intent Analysis**:
   - The new Search Intent Analyzer processes the keyword and SERP data.
   - It determines the primary intent (informational, commercial, transactional, navigational).
   - It identifies ideal content formats, featured snippet opportunities, and maps the user journey.
   - It generates a comprehensive intent data package.

4. **Content Structure Generation**:
   - The Google AI Service uses research data and intent data to create a structured content outline.
   - This includes title, description, headings, and content sections aligned with the detected intent.

5. **Content Enhancement**:
   - The Anthropic Service enhances the structure with detailed paragraphs and examples.
   - Intent data influences the enhancement process for better alignment with user needs.

6. **SEO Optimization**:
   - The SEO Quality Service evaluates and optimizes the content.
   - It generates SEO scores, readability metrics, and improvement suggestions.

7. **Image Generation**:
   - An image is generated based on the keyword, influenced by intent data.
   - This process produces an image URL, alt text, and caption.

8. **Markdown Generation**:
   - The optimized content and image data are compiled into a markdown file.
   - Intent data influences the formatting and presentation.

9. **Hugo Export**:
   - The markdown file is exported in a Hugo-compatible format.
   - The final output includes content files, directory structure, and image resources.

The dotted lines indicate how the intent data influences multiple stages of the process, showing the central role of search intent analysis in creating content that matches user needs. 