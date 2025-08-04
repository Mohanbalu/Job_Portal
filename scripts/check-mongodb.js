// Script to check MongoDB connection and database status
const { MongoClient } = require("mongodb")

async function checkMongoDB() {
  const uri = "mongodb://localhost:27017"
  const client = new MongoClient(uri)

  try {
    console.log("🔄 Connecting to MongoDB...")
    await client.connect()
    console.log("✅ Connected to MongoDB successfully")

    // List databases
    const adminDb = client.db().admin()
    const databases = await adminDb.listDatabases()
    console.log("📊 Available databases:")
    databases.databases.forEach((db) => {
      console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`)
    })

    // Check jobportal database
    const jobportalDb = client.db("jobportal")
    const collections = await jobportalDb.listCollections().toArray()
    console.log("\n📁 Collections in jobportal database:")
    if (collections.length === 0) {
      console.log("  - No collections found (this is normal for a new database)")
    } else {
      collections.forEach((collection) => {
        console.log(`  - ${collection.name}`)
      })
    }

    // Check users collection
    const usersCollection = jobportalDb.collection("users")
    const userCount = await usersCollection.countDocuments()
    console.log(`\n👥 Users in database: ${userCount}`)

    if (userCount > 0) {
      const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray()
      console.log("📋 User data:")
      users.forEach((user) => {
        console.log(`  - ${user.name} (${user.email}) - Created: ${user.createdAt}`)
      })
    }
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message)

    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n💡 Troubleshooting tips:")
      console.log("1. Make sure MongoDB is installed and running")
      console.log("2. Start MongoDB with: mongod")
      console.log("3. Or start MongoDB service: sudo systemctl start mongod")
      console.log("4. Check if MongoDB is running on port 27017")
    }
  } finally {
    await client.close()
  }
}

checkMongoDB()
