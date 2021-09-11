import express from "express";
import handlebars from "express-handlebars";
import http from "http";
import path from "path";
import fs from 'fs/promises';
import { Server }from "socket.io";

const app = express();
const router = express.Router();
const server = http.createServer(app);
const ioServer = new Server(server);

server.listen(8080, () => {
  console.log("Server ON");
});

server.on("error", () => {
  console.log("Error iniciando el server");
});

const ENGINE_NAME = "hbs";

app.engine(
  ENGINE_NAME,
  handlebars({
    extname: `.${ENGINE_NAME}`,
    layoutsDir: path.join(__dirname, '../views/layouts'),
    defaultLayout: path.join(__dirname, '../views/layouts/index.hbs'),
  })
);

app.set("view engine", ENGINE_NAME);
app.set("views", path.join(__dirname, '../views')); 

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', router);

app.get("/", (_req, res) => {
  res.sendFile("index.html", { root: path.join(__dirname, './public') });
});

let messages = [];
ioServer.on("connection", async (socket) => {
  socket.emit("productList", Utils.getAllProducts());
  socket.emit("messageList", await getMessages());
  messages = await getMessages();
  socket.on("new-message", async (data) => {
    messages.push(data);
    await updateMessagesTxt(messages);
    ioServer.sockets.emit("messageList", await getMessages());
  });
});

app.get("/productos/vista", (_, res) => {
  const data = Utils.getAllProducts();
  res.render("main.hbs", { data });
});

router.get('/productos/listar', (_, res) => {
  const products = Utils.getAllProducts();
  res.json(products.length ? products : { error: 'No hay productos cargados.' });
});

router.get('/productos/listar/:id', (req, res) => {
  const product = Utils.getProductByID(Number(req.params.id));
  res.json(product ? product : { error: 'Producto no encontrado.' });
});

router.post('/productos/guardar', (req, res) => {
  Utils.saveProduct(req.body);
  const products = Utils.getAllProducts();
  ioServer.sockets.emit("productList", products);
  res.redirect('/');
});

router.put('/productos/actualizar/:id',(req, res) => {
  const updatedProduct = Utils.updateProduct(req.body, Number(req.params.id));
  res.send(updatedProduct);
});

router.delete('/productos/borrar/:id', (req, res) => {
  const deletedProduct = Utils.deleteProduct(Number(req.params.id));
  res.send(deletedProduct);
});

/// utils
const data = [];

class Utils {
  static getAllProducts() {
    return data;
  };

  static getProductByID(id) {
    return data.find((product) => product.id === id)
  };

  static saveProduct(product) {
    let id = 1;
    if (data.length) {
      const productIds = data.map(product => product.id);
      id = Math.max(...productIds) + 1;
    }
    product['id'] = id;
    data.push(product);
  };

  static updateProduct(product, id) {
    const productIndexToUpdate = data.findIndex((product) => product.id === id);
    if (productIndexToUpdate !== -1) {
      data[productIndexToUpdate] = {...product, id};
      return product;
    } else {
      return { error: 'Producto no encontrado.' };
    };
  };

  static deleteProduct(id) {
    const productIndexToDelete = data.findIndex((product) => product.id === id);
    if (productIndexToDelete !== -1) {
      const productToDelete = data[productIndexToDelete];
      data.splice(productIndexToDelete, 1);
      return productToDelete;
    } else {
      return { error: 'Producto no encontrado.' };
    };
  };
};

const getMessages = async () => {
  try {
    const messageListFileContent = await fs.readFile('./messages.txt', 'utf-8');
    return JSON.parse(messageListFileContent);
  } catch (error) {
    return [];
  };
};

const updateMessagesTxt = async (messages) => {
  try {
    await fs.writeFile('./messages.txt', JSON.stringify(messages))
  } catch (error) {
    console.error("Se produjo un error al guardar el archivo.", error);
  }
};