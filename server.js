const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const HTTP_PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Connect to MongoDB
const mongoURI = "mongodb://localhost:27017/MarketPlace";
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Create a Product schema and model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  category: { type: String, required: true },
});

const Product = mongoose.model("Product", productSchema);

// Deliver the app's home page to browser clients
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Get all products or filter by title query parameter
app.get("/api/products", async (req, res) => {
  const title = req.query.title;
  try {
    let products;
    if (!title) {
      products = await Product.find(); // Fetch all products from the database
    } else {
      products = await Product.find({ name: new RegExp(title, "i") }); // Filter by name
    }
    res.json(products);
  } catch (error) {
    console.error("Error retrieving products:", error); // Log the error
    res.status(500).send("Internal Server Error");
  }
});

// Get one product by ID
app.get("/api/products/:id", async (req, res) => {
  const itemId = req.params.id; // Get the ID from the request parameters
  try {
    const product = await Product.findById(itemId); // Find the product by ID
    if (!product) {
      return res.status(404).send("Resource not found"); // If no product is found, send 404
    }
    res.json(product); // Send the found product as a response
  } catch (error) {
    console.error("Error retrieving product:", error); // Log the error
    res.status(500).send("Internal Server Error"); // Handle any errors
  }
});

// Add a new product
app.post("/api/products", async (req, res) => {
  const newProduct = new Product(req.body); // Create a new product from the request body
  try {
    const savedProduct = await newProduct.save(); // Save the new product to the database
    res.status(201).json(savedProduct); // Respond with the saved product
  } catch (error) {
    console.error("Error adding product:", error); // Log the error
    res.status(400).send("Bad Request"); // Handle any errors
  }
});

// Edit an existing product by ID
app.put("/api/products/:id", async (req, res) => {
  const itemId = req.params.id; // Get the ID from the request parameters
  try {
    const updatedProduct = await Product.findByIdAndUpdate(itemId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedProduct) {
      return res.status(404).send("Resource not found"); // If no product is found, send 404
    }
    res.json(updatedProduct); // Send the updated product as a response
  } catch (error) {
    console.error("Error updating product:", error); // Log the error
    res.status(400).send("Bad Request"); // Handle any errors
  }
});

// Delete a product by ID
app.delete("/api/products/:id", async (req, res) => {
  const itemId = req.params.id; // Get the ID from the request parameters
  try {
    const deletedProduct = await Product.findByIdAndDelete(itemId); // Delete the product by ID
    if (!deletedProduct) {
      return res.status(404).send("Resource not found"); // If no product is found, send 404
    }
    res
      .status(200)
      .json({ message: `Deleted product: ${deletedProduct.name}` }); // Respond with the deleted product name
  } catch (error) {
    console.error("Error deleting product:", error); // Log the error
    res.status(500).send("Internal Server Error"); // Handle any errors
  }
});

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).send("Resource not found");
});

// Start the server and listen for requests
app.listen(HTTP_PORT, () => {
  console.log("Ready to handle requests on port " + HTTP_PORT);
});
