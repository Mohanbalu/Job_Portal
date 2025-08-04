import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

// Enhanced skill extraction with better keyword matching
async function extractSkillsFromJobDescription(description: string): Promise<string[]> {
  try {
    const HF_API_KEY = process.env.HF_API_KEY

    if (!HF_API_KEY) {
      // Fallback to comprehensive keyword extraction
      return extractSkillsWithKeywords(description)
    }

    // Try Hugging Face API first
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Davlan/bert-base-multilingual-cased-ner-hrl",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: description }),
      },
    )

    if (!response.ok) {
      console.log("HF API failed, using fallback")
      return extractSkillsWithKeywords(description)
    }

    const data = await response.json()

    // Extract skills from NER results
    const skills = data[0]
      ?.filter(
        (item: any) => item.entity_group === "SKILL" || item.entity_group === "MISC" || item.entity_group === "ORG",
      )
      ?.map((item: any) => item.word)
      ?.filter((skill: string) => skill.length > 2)

    const extractedSkills = [...new Set(skills || [])]

    // Combine with keyword extraction for better results
    const keywordSkills = extractSkillsWithKeywords(description)
    const combinedSkills = [...new Set([...extractedSkills, ...keywordSkills])]

    return combinedSkills.slice(0, 15) // Limit to 15 skills
  } catch (error) {
    console.error("Skill extraction error:", error)
    return extractSkillsWithKeywords(description)
  }
}

function extractSkillsWithKeywords(text: string): string[] {
  const skillKeywords = [
    // Programming Languages
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C++",
    "C#",
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
    "Elixir",
    "Haskell",
    "Clojure",

    // Frontend Technologies
    "React",
    "Vue.js",
    "Angular",
    "Svelte",
    "Next.js",
    "Nuxt.js",
    "HTML",
    "CSS",
    "SCSS",
    "SASS",
    "Less",
    "TailwindCSS",
    "Bootstrap",
    "Material-UI",
    "Chakra UI",
    "Styled Components",
    "Webpack",
    "Vite",
    "Parcel",

    // Backend Technologies
    "Node.js",
    "Express.js",
    "Django",
    "Flask",
    "FastAPI",
    "Spring Boot",
    "Laravel",
    "Ruby on Rails",
    "ASP.NET",
    "Gin",
    "Echo",
    "Fiber",
    "NestJS",
    "Koa.js",
    "Hapi.js",

    // Databases
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "SQLite",
    "Redis",
    "Elasticsearch",
    "Cassandra",
    "DynamoDB",
    "Firebase",
    "Supabase",
    "PlanetScale",
    "CockroachDB",
    "Neo4j",
    "InfluxDB",

    // Cloud & DevOps
    "AWS",
    "Azure",
    "GCP",
    "Google Cloud",
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

    // Mobile Development
    "React Native",
    "Flutter",
    "iOS",
    "Android",
    "Xamarin",
    "Ionic",
    "Cordova",
    "PhoneGap",

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

    // Testing
    "Jest",
    "Cypress",
    "Selenium",
    "Playwright",
    "Mocha",
    "Chai",
    "Jasmine",
    "PHPUnit",
    "JUnit",

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

    // Methodologies
    "Agile",
    "Scrum",
    "Kanban",
    "DevOps",
    "CI/CD",
    "TDD",
    "BDD",
    "Microservices",
    "REST API",
    "GraphQL",
    "gRPC",
    "WebSocket",
    "OAuth",
    "JWT",
    "SAML",

    // Blockchain & Web3
    "Blockchain",
    "Ethereum",
    "Solidity",
    "Web3",
    "Smart Contracts",
    "DeFi",
    "NFT",
    "Bitcoin",

    // Other Technologies
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
  ]

  const foundSkills = skillKeywords.filter((skill) => text.toLowerCase().includes(skill.toLowerCase()))

  return [...new Set(foundSkills)].slice(0, 12)
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { description } = await request.json()

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: "Description must be at least 10 characters long" }, { status: 400 })
    }

    console.log("🧠 Extracting skills from job description...")
    const extractedSkills = await extractSkillsFromJobDescription(description)
    console.log("✅ Extracted skills:", extractedSkills)

    return NextResponse.json({
      success: true,
      skills: extractedSkills,
      message: `Extracted ${extractedSkills.length} skills from job description`,
    })
  } catch (error: any) {
    console.error("Skill extraction error:", error)
    return NextResponse.json({ error: "Failed to extract skills. Please try again." }, { status: 500 })
  }
}
