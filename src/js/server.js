"use strict";

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _expressHandlebars = require("express-handlebars");

var _expressHandlebars2 = _interopRequireDefault(_expressHandlebars);

var _http = require("http");

var _http2 = _interopRequireDefault(_http);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _promises = require("fs/promises");

var _promises2 = _interopRequireDefault(_promises);

var _socket = require("socket.io");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
var router = _express2.default.Router();
var server = _http2.default.createServer(app);
var ioServer = new _socket.Server(server);

server.listen(8080, function () {
  console.log("Server ON");
});

server.on("error", function () {
  console.log("Error iniciando el server");
});

var ENGINE_NAME = "hbs";

app.engine(ENGINE_NAME, (0, _expressHandlebars2.default)({
  extname: "." + ENGINE_NAME,
  layoutsDir: _path2.default.join(__dirname, '../views/layouts'),
  defaultLayout: _path2.default.join(__dirname, '../views/layouts/index.hbs')
}));

app.set("view engine", ENGINE_NAME);
app.set("views", _path2.default.join(__dirname, '../views'));

app.use(_express2.default.static("public"));
app.use(_express2.default.json());
app.use(_express2.default.urlencoded({ extended: true }));
app.use('/api', router);

app.get("/", function (_req, res) {
  res.sendFile("index.html", { root: _path2.default.join(__dirname, './public') });
});

var messages = [];
ioServer.on("connection", function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(socket) {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            socket.emit("productList", Utils.getAllProducts());
            _context2.t0 = socket;
            _context2.next = 4;
            return getMessages();

          case 4:
            _context2.t1 = _context2.sent;

            _context2.t0.emit.call(_context2.t0, "messageList", _context2.t1);

            _context2.next = 8;
            return getMessages();

          case 8:
            messages = _context2.sent;

            socket.on("new-message", function () {
              var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(data) {
                return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        messages.push(data);
                        _context.next = 3;
                        return updateMessagesTxt(messages);

                      case 3:
                        _context.t0 = ioServer.sockets;
                        _context.next = 6;
                        return getMessages();

                      case 6:
                        _context.t1 = _context.sent;

                        _context.t0.emit.call(_context.t0, "messageList", _context.t1);

                      case 8:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, undefined);
              }));

              return function (_x2) {
                return _ref2.apply(this, arguments);
              };
            }());

          case 10:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}());

app.get("/productos/vista", function (_, res) {
  var data = Utils.getAllProducts();
  res.render("main.hbs", { data: data });
});

router.get('/productos/listar', function (_, res) {
  var products = Utils.getAllProducts();
  res.json(products.length ? products : { error: 'No hay productos cargados.' });
});

router.get('/productos/listar/:id', function (req, res) {
  var product = Utils.getProductByID(Number(req.params.id));
  res.json(product ? product : { error: 'Producto no encontrado.' });
});

router.post('/productos/guardar', function (req, res) {
  Utils.saveProduct(req.body);
  var products = Utils.getAllProducts();
  ioServer.sockets.emit("productList", products);
  res.redirect('/');
});

router.put('/productos/actualizar/:id', function (req, res) {
  var updatedProduct = Utils.updateProduct(req.body, Number(req.params.id));
  res.send(updatedProduct);
});

router.delete('/productos/borrar/:id', function (req, res) {
  var deletedProduct = Utils.deleteProduct(Number(req.params.id));
  res.send(deletedProduct);
});

/// utils
var data = [];

var Utils = function () {
  function Utils() {
    (0, _classCallCheck3.default)(this, Utils);
  }

  (0, _createClass3.default)(Utils, null, [{
    key: "getAllProducts",
    value: function getAllProducts() {
      return data;
    }
  }, {
    key: "getProductByID",
    value: function getProductByID(id) {
      return data.find(function (product) {
        return product.id === id;
      });
    }
  }, {
    key: "saveProduct",
    value: function saveProduct(product) {
      var id = 1;
      if (data.length) {
        var productIds = data.map(function (product) {
          return product.id;
        });
        id = Math.max.apply(Math, (0, _toConsumableArray3.default)(productIds)) + 1;
      }
      product['id'] = id;
      data.push(product);
    }
  }, {
    key: "updateProduct",
    value: function updateProduct(product, id) {
      var productIndexToUpdate = data.findIndex(function (product) {
        return product.id === id;
      });
      if (productIndexToUpdate !== -1) {
        data[productIndexToUpdate] = (0, _extends3.default)({}, product, { id: id });
        return product;
      } else {
        return { error: 'Producto no encontrado.' };
      };
    }
  }, {
    key: "deleteProduct",
    value: function deleteProduct(id) {
      var productIndexToDelete = data.findIndex(function (product) {
        return product.id === id;
      });
      if (productIndexToDelete !== -1) {
        var productToDelete = data[productIndexToDelete];
        data.splice(productIndexToDelete, 1);
        return productToDelete;
      } else {
        return { error: 'Producto no encontrado.' };
      };
    }
  }]);
  return Utils;
}();

;

var getMessages = function () {
  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
    var messageListFileContent;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return _promises2.default.readFile('./messages.txt', 'utf-8');

          case 3:
            messageListFileContent = _context3.sent;
            return _context3.abrupt("return", JSON.parse(messageListFileContent));

          case 7:
            _context3.prev = 7;
            _context3.t0 = _context3["catch"](0);
            return _context3.abrupt("return", []);

          case 10:
            ;

          case 11:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined, [[0, 7]]);
  }));

  return function getMessages() {
    return _ref3.apply(this, arguments);
  };
}();

var updateMessagesTxt = function () {
  var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(messages) {
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            _context4.next = 3;
            return _promises2.default.writeFile('./messages.txt', (0, _stringify2.default)(messages));

          case 3:
            _context4.next = 8;
            break;

          case 5:
            _context4.prev = 5;
            _context4.t0 = _context4["catch"](0);

            console.error("Se produjo un error al guardar el archivo.", _context4.t0);

          case 8:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, undefined, [[0, 5]]);
  }));

  return function updateMessagesTxt(_x3) {
    return _ref4.apply(this, arguments);
  };
}();
