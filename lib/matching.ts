// Advanced job matching algorithms
export interface MatchResult {
  score: number
  commonSkills: string[]
  missingSkills: string[]
  explanation: string
}

// Calculate match score using multiple algorithms
export function calculateJobMatch(userSkills: string[], jobSkills: string[]): MatchResult {
  if (!userSkills.length || !jobSkills.length) {
    return {
      score: 0,
      commonSkills: [],
      missingSkills: jobSkills,
      explanation: "No skills to compare",
    }
  }

  // Normalize skills (lowercase, trim)
  const normalizedUserSkills = userSkills.map((skill) => skill.toLowerCase().trim())
  const normalizedJobSkills = jobSkills.map((skill) => skill.toLowerCase().trim())

  // Find exact matches
  const exactMatches = normalizedJobSkills.filter((jobSkill) => normalizedUserSkills.includes(jobSkill))

  // Find partial matches (substring matching)
  const partialMatches = normalizedJobSkills.filter(
    (jobSkill) =>
      !exactMatches.includes(jobSkill) &&
      normalizedUserSkills.some((userSkill) => userSkill.includes(jobSkill) || jobSkill.includes(userSkill)),
  )

  // Find missing skills
  const missingSkills = jobSkills.filter(
    (jobSkill) => !exactMatches.includes(jobSkill.toLowerCase()) && !partialMatches.includes(jobSkill.toLowerCase()),
  )

  // Calculate weighted score
  const exactWeight = 1.0
  const partialWeight = 0.6
  const totalPossibleScore = normalizedJobSkills.length

  const score = Math.min(
    100,
    Math.round(
      ((exactMatches.length * exactWeight + partialMatches.length * partialWeight) / totalPossibleScore) * 100,
    ),
  )

  // Get original case common skills
  const commonSkills = jobSkills.filter(
    (jobSkill) => exactMatches.includes(jobSkill.toLowerCase()) || partialMatches.includes(jobSkill.toLowerCase()),
  )

  // Generate explanation
  let explanation = ""
  if (score >= 80) {
    explanation = "Excellent match! You have most required skills."
  } else if (score >= 60) {
    explanation = "Good match! You meet many requirements."
  } else if (score >= 40) {
    explanation = "Partial match. Consider applying if interested."
  } else if (score >= 20) {
    explanation = "Limited match. May require additional skills."
  } else {
    explanation = "Low match. Significant skill gap exists."
  }

  return {
    score,
    commonSkills,
    missingSkills,
    explanation,
  }
}

// Calculate user similarity for connection suggestions
export function calculateUserSimilarity(
  user1Skills: string[],
  user2Skills: string[],
): {
  score: number
  commonSkills: string[]
  uniqueSkills: string[]
} {
  if (!user1Skills.length || !user2Skills.length) {
    return { score: 0, commonSkills: [], uniqueSkills: [] }
  }

  const skills1 = user1Skills.map((s) => s.toLowerCase())
  const skills2 = user2Skills.map((s) => s.toLowerCase())

  const commonSkills = user1Skills.filter((skill) => skills2.includes(skill.toLowerCase()))

  const uniqueSkills = user2Skills.filter((skill) => !skills1.includes(skill.toLowerCase()))

  // Jaccard similarity coefficient
  const union = new Set([...skills1, ...skills2])
  const intersection = commonSkills.length
  const score = Math.round((intersection / union.size) * 100)

  return {
    score,
    commonSkills,
    uniqueSkills: uniqueSkills.slice(0, 5), // Limit to 5 unique skills
  }
}

// TF-IDF based text similarity (for job descriptions)
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0

  // Simple word frequency approach
  const getWordFreq = (text: string) => {
    const words = text.toLowerCase().match(/\b\w+\b/g) || []
    const freq: { [key: string]: number } = {}
    words.forEach((word) => {
      if (word.length > 2) {
        // Skip short words
        freq[word] = (freq[word] || 0) + 1
      }
    })
    return freq
  }

  const freq1 = getWordFreq(text1)
  const freq2 = getWordFreq(text2)

  const allWords = new Set([...Object.keys(freq1), ...Object.keys(freq2)])

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (const word of allWords) {
    const f1 = freq1[word] || 0
    const f2 = freq2[word] || 0

    dotProduct += f1 * f2
    norm1 += f1 * f1
    norm2 += f2 * f2
  }

  if (norm1 === 0 || norm2 === 0) return 0

  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  return Math.round(similarity * 100)
}
