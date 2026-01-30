db = connect("mongodb://mongo:27017/kyc-vault");

db.createCollection("users");

db.users.insertMany([
    {
        name: "John Doe",
        email: "john.doe@example.com",
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);