import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

// Create a new user
export async function POST(request: NextRequest) {
  try {
    const { username, email } = await request.json();

    const result = await sql`
      INSERT INTO users (username, email)
      VALUES (${username}, ${email})
      RETURNING id
    `;

    const newUserId = result.rows[0].id;
    return NextResponse.json(
      { id: newUserId, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// Get all users
export async function GET() {
  try {
    const result = await sql`SELECT * FROM users`;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Update a user
export async function PUT(request: NextRequest) {
  try {
    const { id, username, email } = await request.json();

    const result = await sql`
      UPDATE users
      SET username = ${username}, email = ${email}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    const result = await sql`
      DELETE FROM users
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User deleted successfully",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

// Seed database with diverse posts for each user
export async function PATCH(request: NextRequest) {
  try {
    // Fetch all users
    const usersResult = await sql`SELECT id, username FROM users`;
    const users = usersResult.rows;

    // Define a wide range of user identities and topics
    const identities = [
      {
        profession: "Chef",
        topics: [
          "gourmet cooking",
          "food pairing",
          "restaurant management",
          "sustainable sourcing",
          "molecular gastronomy",
          "culinary traditions",
          "food photography",
          "menu design",
          "kitchen efficiency",
          "food trends",
        ],
        style: "enthusiastic",
        region: "Mediterranean",
        writingStyle: "Uses lots of culinary metaphors and food-related puns",
      },
      {
        profession: "Teacher",
        topics: [
          "innovative pedagogy",
          "student engagement",
          "educational technology",
          "inclusive education",
          "project-based learning",
          "assessment strategies",
          "classroom management",
          "STEM education",
          "social-emotional learning",
          "global education",
        ],
        style: "thoughtful",
        region: "Scandinavian",
        writingStyle:
          "Structures posts like lesson plans with clear objectives and takeaways",
      },
      {
        profession: "Software Developer",
        topics: [
          "machine learning",
          "blockchain",
          "cybersecurity",
          "cloud computing",
          "DevOps",
          "mobile app development",
          "web accessibility",
          "IoT",
          "augmented reality",
          "quantum computing",
        ],
        style: "technical",
        region: "Silicon Valley",
        writingStyle: "Uses coding syntax and tech jargon in everyday language",
      },
      {
        profession: "Fitness Trainer",
        topics: [
          "HIIT workouts",
          "sports nutrition",
          "injury prevention",
          "mind-body connection",
          "functional training",
          "recovery techniques",
          "fitness technology",
          "group fitness trends",
          "senior fitness",
          "youth athletics",
        ],
        style: "motivational",
        region: "California",
        writingStyle: "Uses fitness-related idioms and motivational quotes",
      },
      {
        profession: "Artist",
        topics: [
          "abstract expressionism",
          "digital art",
          "art therapy",
          "public installations",
          "mixed media",
          "art market trends",
          "collaborative art",
          "eco-art",
          "performance art",
          "art education",
        ],
        style: "creative",
        region: "New York City",
        writingStyle: "Uses artistic metaphors and art-related puns",
      },
      {
        profession: "Environmentalist",
        topics: [
          "renewable energy",
          "sustainable living",
          "wildlife conservation",
          "climate change mitigation",
          "zero-waste lifestyle",
          "ocean conservation",
          "green technology",
          "environmental policy",
          "urban ecology",
          "sustainable agriculture",
        ],
        style: "passionate",
        region: "Pacific Northwest",
        writingStyle:
          "Uses environmental metaphors and sustainability-related puns",
      },
      {
        profession: "Financial Advisor",
        topics: [
          "investment strategies",
          "retirement planning",
          "cryptocurrency",
          "tax optimization",
          "estate planning",
          "risk management",
          "financial literacy",
          "ethical investing",
          "fintech innovations",
          "global markets",
        ],
        style: "analytical",
        region: "Wall Street",
        writingStyle: "Uses financial metaphors and economic jargon",
      },
      {
        profession: "Psychologist",
        topics: [
          "cognitive behavioral therapy",
          "positive psychology",
          "mental health awareness",
          "trauma-informed care",
          "mindfulness practices",
          "neuropsychology",
          "child development",
          "addiction treatment",
          "teletherapy",
          "workplace psychology",
        ],
        style: "empathetic",
        region: "Psych Central",
        writingStyle:
          "Uses psychological metaphors and mental health-related puns",
      },
      {
        profession: "Journalist",
        topics: [
          "investigative reporting",
          "data journalism",
          "media ethics",
          "digital storytelling",
          "fact-checking",
          "citizen journalism",
          "press freedom",
          "multimedia journalism",
          "long-form journalism",
          "solutions journalism",
        ],
        style: "inquisitive",
        region: "Newsroom",
        writingStyle: "Uses journalistic metaphors and news-related puns",
      },
      {
        profession: "Architect",
        topics: [
          "sustainable design",
          "urban planning",
          "historical preservation",
          "parametric architecture",
          "biophilic design",
          "adaptive reuse",
          "smart cities",
          "3D printing in construction",
          "inclusive design",
          "virtual reality in architecture",
        ],
        style: "visionary",
        region: "Skylines",
        writingStyle: "Uses architectural metaphors and design-related puns",
      },
      {
        profession: "Musician",
        topics: [
          "music theory",
          "sound engineering",
          "indie music scene",
          "music streaming economics",
          "virtual concerts",
          "music therapy",
          "world music fusion",
          "music education",
          "AI in music composition",
          "instrument innovation",
        ],
        style: "expressive",
        region: "Music Studio",
        writingStyle: "Uses musical metaphors and music-related puns",
      },
      {
        profession: "Entrepreneur",
        topics: [
          "startup ecosystems",
          "venture capital",
          "disruptive innovation",
          "social entrepreneurship",
          "lean startup methodology",
          "scaling strategies",
          "business pivoting",
          "startup accelerators",
          "bootstrapping",
          "exit strategies",
        ],
        style: "ambitious",
        region: "Silicon Valley",
        writingStyle:
          "Uses entrepreneurial metaphors and business-related puns",
      },
      {
        profession: "Biologist",
        topics: [
          "genomics",
          "marine biology",
          "ecological restoration",
          "synthetic biology",
          "biodiversity conservation",
          "stem cell research",
          "bioinformatics",
          "climate change biology",
          "microbiology",
          "evolutionary biology",
        ],
        style: "curious",
        region: "Laboratory",
        writingStyle: "Uses biological metaphors and science-related puns",
      },
      {
        profession: "Fashion Designer",
        topics: [
          "sustainable fashion",
          "avant-garde design",
          "textile innovation",
          "fashion tech",
          "upcycling",
          "inclusive sizing",
          "cultural fusion in fashion",
          "fashion psychology",
          "virtual fashion",
          "circular fashion",
        ],
        style: "trendsetting",
        region: "Fashion Runway",
        writingStyle: "Uses fashion-related metaphors and design-related puns",
      },
      {
        profession: "Data Scientist",
        topics: [
          "big data analytics",
          "predictive modeling",
          "data visualization",
          "natural language processing",
          "ethical AI",
          "edge computing",
          "real-time analytics",
          "data privacy",
          "computer vision",
          "time series analysis",
        ],
        style: "analytical",
        region: "Data Center",
        writingStyle: "Uses data-related metaphors and analytics-related puns",
      },
      {
        profession: "Nutritionist",
        topics: [
          "personalized nutrition",
          "plant-based diets",
          "gut health",
          "nutrigenomics",
          "sports nutrition",
          "eating disorders",
          "food allergies and intolerances",
          "childhood nutrition",
          "mindful eating",
          "nutrition policy",
        ],
        style: "informative",
        region: "Health Clinic",
        writingStyle:
          "Uses nutrition-related metaphors and health-related puns",
      },
      {
        profession: "Urban Planner",
        topics: [
          "smart city initiatives",
          "affordable housing",
          "transit-oriented development",
          "green infrastructure",
          "placemaking",
          "urban resilience",
          "participatory planning",
          "15-minute cities",
          "urban agriculture",
          "tactical urbanism",
        ],
        style: "forward-thinking",
        region: "Cityscape",
        writingStyle:
          "Uses urban planning-related metaphors and city-related puns",
      },
      {
        profession: "Archaeologist",
        topics: [
          "digital archaeology",
          "underwater archaeology",
          "cultural heritage preservation",
          "ancient technologies",
          "archaeogenetics",
          "remote sensing in archaeology",
          "community archaeology",
          "experimental archaeology",
          "geoarchaeology",
          "conflict archaeology",
        ],
        style: "exploratory",
        region: "Excavation Site",
        writingStyle:
          "Uses archaeological metaphors and discovery-related puns",
      },
      {
        profession: "Renewable Energy Engineer",
        topics: [
          "solar energy innovations",
          "wind power optimization",
          "energy storage solutions",
          "smart grid technologies",
          "tidal energy",
          "geothermal systems",
          "hydrogen fuel cells",
          "biomass energy",
          "energy efficiency",
          "microgrid development",
        ],
        style: "innovative",
        region: "Power Plant",
        writingStyle:
          "Uses energy-related metaphors and innovation-related puns",
      },
      {
        profession: "Social Worker",
        topics: [
          "trauma-informed care",
          "community development",
          "child welfare",
          "mental health advocacy",
          "social justice",
          "gerontological social work",
          "substance abuse treatment",
          "crisis intervention",
          "school social work",
          "international social work",
        ],
        style: "compassionate",
        region: "Community Center",
        writingStyle:
          "Uses social work-related metaphors and community-related puns",
      },
    ];

    // Shuffle the identities array
    const shuffledIdentities = identities.sort(() => 0.5 - Math.random());

    // Generate posts for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const identity = shuffledIdentities[i % shuffledIdentities.length];

      // Generate 3-5 posts for each user
      const postCount = Math.floor(Math.random() * 3) + 3;
      for (let j = 0; j < postCount; j++) {
        const topic = identity.topics[j % identity.topics.length];
        const content = generatePost(
          user.username,
          identity.profession,
          topic,
          identity.style,
          identity.region,
          identity.writingStyle
        );

        // Generate a random date within the last year
        const randomDate = new Date(
          Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
        );

        await sql`
          INSERT INTO posts (user_id, content, created_at)
          VALUES (${user.id}, ${content}, ${randomDate.toISOString()})
        `;
      }
    }

    return NextResponse.json({
      message: "Database seeded with diverse and unique posts for each user",
    });
  } catch (error) {
    console.error("Failed to seed database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}

function generatePost(
  username: string,
  profession: string,
  topic: string,
  style: string,
  region: string,
  writingStyle: string
): string {
  const postTypes = [
    "opinion",
    "question",
    "fact",
    "announcement",
    "debate",
    "recommendation",
    "story",
    "tip",
    "challenge",
    "reflection",
  ];

  const postType = postTypes[Math.floor(Math.random() * postTypes.length)];

  let content = "";
  switch (postType) {
    case "opinion":
      content = `${
        style === "passionate" ? "🔥 " : ""
      }In my ${region}-inspired view, ${topic} is crucial for ${profession}s. Thoughts?`;
      break;
    case "question":
      content = `${
        style === "curious" ? "🤔 " : ""
      }Fellow ${profession}s, especially those in ${region}, how do you approach ${topic}?`;
      break;
    case "fact":
      content = `${
        style === "analytical" ? "📊 " : ""
      }${region} ${profession} fact: ${topic} can increase efficiency by 30% in our work.`;
      break;
    case "announcement":
      content = `${
        style === "enthusiastic" ? "📢 " : ""
      }Exciting news from ${region}! Starting a new project on ${topic}! #${profession}Life`;
      break;
    case "debate":
      content = `${
        style === "inquisitive" ? "🗣️ " : ""
      }Hot take from ${region}: ${topic} is overrated in ${profession}. Change my mind!`;
      break;
    case "recommendation":
      content = `${
        style === "helpful" ? "💡 " : ""
      }${profession}s in ${region}, check out this amazing resource on ${topic}!`;
      break;
    case "story":
      content = `Once upon a time in ${region}, a ${profession} discovered how ${topic} changed everything...`;
      break;
    case "tip":
      content = `Quick ${region} ${profession} tip: Mastering ${topic} can significantly boost your career. Here's how...`;
      break;
    case "challenge":
      content = `${region} ${profession}s, I challenge you to incorporate ${topic} into your work this week! Who's in?`;
      break;
    case "reflection":
      content = `Reflecting on my journey as a ${profession} in ${region}, ${topic} has been a game-changer. Here's why...`;
      break;
  }

  // Apply the unique writing style
  content = applyWritingStyle(content, writingStyle);

  // Ensure the content is no longer than 140 characters
  return content.length > 140 ? content.slice(0, 137) + "..." : content;
}

function applyWritingStyle(content: string, writingStyle: string): string {
  // This function can be expanded to apply more sophisticated writing style transformations
  if (writingStyle.includes("culinary metaphors")) {
    return content.replace("crucial", "as essential as salt in cooking");
  } else if (writingStyle.includes("lesson plans")) {
    return `Objective: Understand ${content}`;
  } else if (writingStyle.includes("coding syntax")) {
    return `if (${content}) { console.log('Interesting!'); }`;
  }
  // Add more writing style transformations here
  return content;
}
