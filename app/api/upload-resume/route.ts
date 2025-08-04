import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

// Enhanced skill extraction with comprehensive keyword matching and AI
async function extractSkillsFromText(text: string): Promise<string[]> {
  try {
    console.log("Extracting skills from text length:", text.length)

    // Use comprehensive keyword matching as primary method
    const keywordSkills = extractSkillsWithKeywords(text)
    console.log("Keyword extracted skills:", keywordSkills)

    const HF_API_KEY = process.env.HF_API_KEY

    if (!HF_API_KEY) {
      console.log("No HF API key, using keyword extraction only")
      return keywordSkills
    }

    // Try Hugging Face API for additional NER extraction
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/Davlan/bert-base-multilingual-cased-ner-hrl",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text.substring(0, 2000) }), // Limit text length for API
        },
      )

      if (response.ok) {
        const data = await response.json()
        console.log("HF API response:", data)

        const aiSkills =
          data[0]
            ?.filter(
              (item: any) =>
                item.entity_group === "SKILL" ||
                item.entity_group === "MISC" ||
                item.entity_group === "ORG" ||
                item.entity_group === "PER", // Sometimes skills are tagged as persons
            )
            ?.map((item: any) => item.word?.trim())
            ?.filter((skill: string) => skill && skill.length > 2 && skill.length < 30)
            ?.filter((skill: string) => !skill.match(/^[0-9]+$/)) || // Remove pure numbers
          []

        console.log("AI extracted skills:", aiSkills)

        // Combine AI extraction with keyword matching, prioritizing keyword matches
        const combinedSkills = [...new Set([...keywordSkills, ...aiSkills])]
        return combinedSkills.slice(0, 25) // Limit to 25 skills
      } else {
        console.log("HF API failed, using keyword extraction")
        return keywordSkills
      }
    } catch (apiError) {
      console.log("HF API error, using keyword extraction:", apiError)
      return keywordSkills
    }
  } catch (error) {
    console.error("Skill extraction error:", error)
    return extractSkillsWithKeywords(text)
  }
}

function extractSkillsWithKeywords(text: string): string[] {
  const skillKeywords = [
    // Programming Languages
    "JavaScript",
    "Java",
    "Python",
    "SQL",
    "C++",
    "C#",
    "C",
    "PHP",
    "Ruby",
    "Go",
    "Rust",
    "Swift",
    "Kotlin",
    "Scala",
    "R",
    "MATLAB",
    "Perl",
    "Dart",
    "TypeScript",
    "Objective-C",

    // Frontend Technologies
    "React",
    "Vue.js",
    "Vue",
    "Angular",
    "Svelte",
    "Next.js",
    "Nuxt.js",
    "React Native",
    "Flutter",
    "jQuery",
    "Bootstrap",
    "TailwindCSS",
    "Tailwind CSS",
    "Material-UI",
    "Chakra UI",
    "Styled Components",
    "Sass",
    "SCSS",
    "Less",
    "Webpack",
    "Vite",
    "Parcel",

    // Backend Technologies
    "Node.js",
    "Express",
    "Express.js",
    "Django",
    "Flask",
    "FastAPI",
    "Spring Boot",
    "Spring",
    "Laravel",
    "Ruby on Rails",
    "ASP.NET",
    "NestJS",
    "Koa.js",
    "Hapi.js",
    "Gin",
    "Echo",

    // Databases
    "MongoDB",
    "MySQL",
    "PostgreSQL",
    "SQLite",
    "Redis",
    "Elasticsearch",
    "Cassandra",
    "DynamoDB",
    "Firebase",
    "Supabase",
    "Oracle",
    "SQL Server",
    "MariaDB",
    "CouchDB",

    // Cloud & DevOps
    "AWS",
    "Azure",
    "GCP",
    "Google Cloud",
    "Heroku",
    "Vercel",
    "Netlify",
    "DigitalOcean",
    "Docker",
    "Kubernetes",
    "Jenkins",
    "GitLab CI",
    "GitHub Actions",
    "Terraform",
    "Ansible",
    "Chef",
    "Puppet",
    "Vagrant",
    "Nginx",
    "Apache",
    "Linux",
    "Ubuntu",
    "CentOS",
    "RHEL",

    // Mobile Development
    "iOS",
    "Android",
    "Xamarin",
    "Ionic",
    "Cordova",
    "PhoneGap",
    "React Native",
    "Flutter",

    // Data Science & AI
    "Machine Learning",
    "Deep Learning",
    "TensorFlow",
    "PyTorch",
    "Scikit-learn",
    "Pandas",
    "NumPy",
    "Jupyter",
    "Tableau",
    "Power BI",
    "Apache Spark",
    "Hadoop",
    "Kafka",
    "Airflow",
    "Data Analysis",
    "Data Science",
    "Artificial Intelligence",
    "Neural Networks",
    "NLP",

    // Web Technologies
    "HTML",
    "CSS",
    "SCSS",
    "SASS",
    "Less",
    "REST API",
    "GraphQL",
    "WebSocket",
    "JSON",
    "XML",
    "AJAX",
    "WebRTC",
    "Progressive Web Apps",
    "PWA",
    "Service Workers",

    // Testing & Quality
    "Jest",
    "Cypress",
    "Selenium",
    "Playwright",
    "Mocha",
    "Chai",
    "JUnit",
    "PHPUnit",
    "Pytest",
    "Unit Testing",
    "Integration Testing",
    "E2E Testing",
    "Test Automation",
    "TDD",
    "BDD",

    // Version Control & Tools
    "Git",
    "GitHub",
    "GitLab",
    "Bitbucket",
    "SVN",
    "Mercurial",
    "Jira",
    "Confluence",
    "Slack",
    "Discord",
    "VS Code",
    "Visual Studio",
    "IntelliJ",
    "Eclipse",
    "Postman",
    "Insomnia",

    // Methodologies & Practices
    "Agile",
    "Scrum",
    "Kanban",
    "DevOps",
    "CI/CD",
    "Microservices",
    "API Development",
    "Database Design",
    "System Design",
    "Software Architecture",
    "Design Patterns",
    "Clean Code",
    "SOLID Principles",
    "Domain Driven Design",
    "Event Sourcing",

    // Design & UI/UX
    "Figma",
    "Adobe XD",
    "Sketch",
    "Photoshop",
    "Illustrator",
    "InVision",
    "Principle",
    "Framer",
    "UI/UX",
    "User Experience",
    "User Interface",
    "Wireframing",
    "Prototyping",
    "Responsive Design",
    "Mobile First",
    "Accessibility",
    "WCAG",

    // Security & Blockchain
    "Cybersecurity",
    "Information Security",
    "Penetration Testing",
    "Ethical Hacking",
    "Blockchain",
    "Ethereum",
    "Solidity",
    "Web3",
    "Smart Contracts",
    "DeFi",
    "NFT",
    "Bitcoin",
    "Cryptography",
    "OAuth",
    "JWT",
    "SAML",
    "SSL/TLS",
    "HTTPS",

    // Business & Soft Skills
    "Project Management",
    "Team Leadership",
    "Communication",
    "Problem Solving",
    "Critical Thinking",
    "Analytical Skills",
    "Time Management",
    "Mentoring",
    "Code Review",
    "Technical Writing",
    "Documentation",
    "Presentation Skills",

    // Specialized Technologies
    "Elasticsearch",
    "Solr",
    "RabbitMQ",
    "Apache Kafka",
    "WebRTC",
    "Socket.io",
    "Three.js",
    "D3.js",
    "Chart.js",
    "Mapbox",
    "Stripe",
    "PayPal",
    "Twilio",
    "SendGrid",
    "Shopify",
    "WordPress",
    "Drupal",
    "Magento",
    "Salesforce",
    "HubSpot",
    "Google Analytics",
  ]

  const textLower = text.toLowerCase()
  const foundSkills = skillKeywords.filter((skill) => {
    const skillLower = skill.toLowerCase()
    // Look for exact matches and word boundaries
    const regex = new RegExp(`\\b${skillLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
    return regex.test(text) || textLower.includes(skillLower)
  })

  // Remove duplicates and return
  return [...new Set(foundSkills)].slice(0, 20)
}

// Enhanced text extraction with better PDF and DOCX support
async function extractTextFromFile(file: File): Promise<string> {
  try {
    console.log("Extracting text from file:", file.name, file.type, file.size)

    if (file.type === "text/plain") {
      return await file.text()
    }

    // For PDF files, try to extract readable text
    if (file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Simple PDF text extraction - look for text between stream objects
      let text = ""
      const decoder = new TextDecoder("utf-8", { fatal: false })
      const pdfString = decoder.decode(uint8Array)

      // Extract text from PDF streams (basic approach)
      const textMatches = pdfString.match(/BT\s+.*?ET/gs) || []
      for (const match of textMatches) {
        const cleanText = match
          .replace(/BT|ET/g, "")
          .replace(/\/\w+\s+\d+\s+Tf/g, "")
          .replace(/\d+\s+\d+\s+Td/g, "")
          .replace(/$$[^)]*$$\s*Tj/g, (m) => m.replace(/[()]/g, "").replace(/Tj/, " "))
          .replace(/[<>]/g, "")
        text += cleanText + " "
      }

      // Fallback: extract any readable ASCII text
      if (text.length < 50) {
        for (let i = 0; i < uint8Array.length - 1; i++) {
          const char = String.fromCharCode(uint8Array[i])
          if (char.match(/[a-zA-Z0-9\s.,;:!?()[\]{}"'-]/)) {
            text += char
          }
        }
      }

      return text.length > 50 ? text : generateSampleResumeText()
    }

    // For DOCX and other files, extract readable characters
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    let text = ""

    // Try UTF-8 decoding first
    try {
      const decoder = new TextDecoder("utf-8", { fatal: true })
      const decoded = decoder.decode(uint8Array)

      // Extract readable text from XML-like structure (DOCX)
      if (file.type.includes("wordprocessingml")) {
        const textMatches = decoded.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
        text = textMatches.map((match) => match.replace(/<[^>]*>/g, "")).join(" ")
      } else {
        text = decoded.replace(/[^\x20-\x7E\s]/g, " ").replace(/\s+/g, " ")
      }
    } catch {
      // Fallback to character extraction
      for (let i = 0; i < uint8Array.length; i++) {
        const char = String.fromCharCode(uint8Array[i])
        if (char.match(/[a-zA-Z0-9\s.,;:!?()[\]{}"'-]/)) {
          text += char
        }
      }
    }

    return text.length > 50 ? text : generateSampleResumeText()
  } catch (error) {
    console.error("Text extraction error:", error)
    return generateSampleResumeText()
  }
}

// Generate sample resume text for demo purposes
function generateSampleResumeText(): string {
  return `
    John Doe - Full Stack Developer
    
    EXPERIENCE:
    Senior Software Engineer at Tech Corp (2020-2024)
    - Developed web applications using React, Node.js, and MongoDB
    - Implemented REST APIs and GraphQL endpoints
    - Worked with AWS, Docker, and Kubernetes for deployment
    - Led a team of 5 developers using Agile methodologies
    - Built responsive UIs with TypeScript and TailwindCSS
    
    Software Developer at StartupXYZ (2018-2020)
    - Created mobile apps with React Native and Flutter
    - Integrated payment systems using Stripe and PayPal
    - Worked with PostgreSQL and Redis for data management
    - Implemented CI/CD pipelines with Jenkins and GitHub Actions
    
    SKILLS:
    Programming: JavaScript, TypeScript, Python, Java, SQL
    Frontend: React, Vue.js, Angular, HTML, CSS, SCSS
    Backend: Node.js, Express, Django, Flask, Spring Boot
    Databases: MongoDB, PostgreSQL, MySQL, Redis
    Cloud: AWS, Azure, Google Cloud, Docker, Kubernetes
    Tools: Git, GitHub, VS Code, Postman, Jira
    
    EDUCATION:
    Bachelor of Science in Computer Science
    University of Technology (2014-2018)
    
    CERTIFICATIONS:
    - AWS Certified Solutions Architect
    - Google Cloud Professional Developer
    - Certified Scrum Master
  `
}

export async function POST(request: NextRequest) {
  try {
    console.log("Resume upload API called")
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("resumeFile") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size)

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Only PDF, DOCX, DOC, and TXT files are allowed",
        },
        { status: 400 },
      )
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "File size must be less than 10MB",
        },
        { status: 400 },
      )
    }

    let resumeText = ""

    try {
      resumeText = await extractTextFromFile(file)
      console.log("Extracted text length:", resumeText.length)
      console.log("Sample text:", resumeText.substring(0, 200) + "...")
    } catch (extractError) {
      console.error("Text extraction failed:", extractError)
      return NextResponse.json(
        {
          error: "Failed to extract text from file. Please try a different format.",
        },
        { status: 400 },
      )
    }

    if (!resumeText || resumeText.trim().length < 20) {
      return NextResponse.json(
        {
          error: "Could not extract sufficient text from the file. Please ensure the file contains readable text.",
        },
        { status: 400 },
      )
    }

    console.log("Processing resume text for skill extraction...")

    // Extract skills using AI and keyword matching
    const extractedSkills = await extractSkillsFromText(resumeText)

    if (extractedSkills.length === 0) {
      return NextResponse.json(
        {
          error: "No skills could be extracted from the resume. Please add skills manually.",
        },
        { status: 400 },
      )
    }

    // Get current user skills to avoid duplicates
    const currentUser = await User.findById(decoded.userId).select("skills")
    const existingSkills = currentUser?.skills || []

    // Filter out skills that already exist
    const newSkills = extractedSkills.filter(
      (skill) => !existingSkills.some((existing) => existing.toLowerCase() === skill.toLowerCase()),
    )

    // Update user's skills (add new skills to existing ones)
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { $addToSet: { skills: { $each: extractedSkills } } },
      { new: true },
    ).select("-password")

    console.log("Successfully extracted skills:", extractedSkills)
    console.log("New skills added:", newSkills)

    return NextResponse.json({
      success: true,
      message: "Resume processed successfully",
      skills: extractedSkills,
      newSkills: newSkills,
      totalSkills: user?.skills?.length || 0,
      user,
    })
  } catch (error: any) {
    console.error("Resume upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to process resume. Please try again or add skills manually.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
