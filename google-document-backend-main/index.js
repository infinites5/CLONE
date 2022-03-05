const express = require("express");
const app = express();
// const server = require("http").createServer(app);
// const cors = require("cors");

const mongoose = require("mongoose");
const Document = require("./Document");
const mongodb = process.env.MONGODB_URL || "mongodb+srv://joyce:admin%40123@cluster0.fqwyn.mongodb.net/googledoc?retryWrites=true&w=majority";

mongoose.connect(mongodb, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
})
const port = process.env.PORT || 3001
const io = require("socket.io")(port, {
  cors: {
    origin: "https://joyce-google-doc-clone.netlify.app/",
    methods: ["GET", "POST"],
  },
})
// const io = require("socket.io")(server, {
//   cors: {
//       origin: "*",
//       methods: ["GET", "POST"]
//   }
// });

// app.use(cors());

const defaultValue = ""

io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: defaultValue })
}

app.get("/", (req, res) => {
  res.send("Server is running");
});

