const {
    createBot,
    createProvider,
    createFlow,
    addKeyword,
    addAnswer,
} = require('@bot-whatsapp/bot');

const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MongoAdapter = require('@bot-whatsapp/database/mock');
const Fuse = require('fuse.js');
const { extensionForMediaMessage, delay } = require('@adiwajshing/baileys');

/**
 * Declaramos las conexiones de Mongo
**/
const MONGO_DB_URI = 'mongodb+srv://gusdev27:27082002gr@chatbot.40apnuo.mongodb.net/?retryWrites=true&w=majority'
const MONGO_DB_NAME = 'db_bot'

const pass = () => {
  delay(100)
  console.log('pass');
};

const productData = async () => {
    const response = await fetch('http://localhost:3001/api.json');
    const data = await response.json();
    return data;
};

// function fuzzySearch(searchName, products) {
//   let bestMatches = [];
//   let bestMatchScore = 0;
  
//   for (let i = 0; i < products.length; i++) {
//     let product = products[i];
//     let productName = product.name.toLowerCase();
//     searchName = searchName.toLowerCase();
  
//     let score = 0;
//     let productIndex = 0;
//     let searchIndex = 0;
  
//     while (productIndex < productName.length && searchIndex < searchName.length) {
//       if (productName[productIndex] === searchName[searchIndex]) {
//         score += (productIndex + 1) * 2;
//       }
  
//       productIndex++;
//       searchIndex++;
//     }
  
//     score = score / (productName.length * (productName.length + 1));
  
//     if (score > bestMatchScore) {
//       bestMatchScore = score;
//       bestMatches = [product];
//     } else if (score === bestMatchScore) {
//       bestMatches.push(product);
//     }
//   }
  
//   return bestMatches;
// }

const options = {
  // isCaseSensitive: false,
  includeScore: false,
  shouldSort: true,
  includeMatches: false,
  findAllMatches: false,
  minMatchCharLength: 1,
  // location: 0,
  threshold: 0.2,
  // distance: 100,
  // useExtendedSearch: false,
  // ignoreLocation: false,
  // ignoreFieldNorm: false,
  // fieldNormWeight: 0.7,
  keys: [
    {
      name: 'name',
      weight: 0.7
    },
    {
      name: 'brand',
      weight: 0.3
    }
  ]
}; 

const returnFlow = addKeyword(['❌Cancelar búsqueda❌', 'Quiero hacer otra pregunta']).addAnswer(['¿En que mas puedo ayudarte? 🫡', " ", 'Selecciona una respuesta ⬇'], 
 {
    capture:true,
    buttons: [
        { body: 'Preguntar por un producto 🔎' },
        { body: 'Contactar con trabajador 👩‍💻' },   
        { body: 'Donde ubicarnos 📍' },
    ]
 });

 const productFlow = addKeyword(['Preguntar por un producto 🔎', 'Seguir buscando 🔎'])
 .addAnswer(['Escribe el nombre del producto que quieres encontrar. 🔎', '', '*Ejemplo:* Destornillador estria.', '', 'Si buscas una marca escribe el nombre.']
 , {
   capture: true,
   buttons: [
       {body: '❌Cancelar búsqueda❌'}
   ]
 }, async (ctx, {flowDynamic, endFlow, fallBack}) => {
   
   const data = await productData();
   const search = await ctx.body;
   const fuse = new Fuse(data, options);
   let matches = fuse.search(search);
   flag = false
 
   if (ctx.body !== '❌Cancelar búsqueda❌'){

    await  matches.map(match => { 
          available = '❌'
          if (match.item.qty > 0){
              available = '✅'
          };
          
          flowDynamic([{
              body: `*${match.item.name}* \n*Precio:* ${match.item.price}$\n*Marca:* ${match.item.brand} \n*Disponibilidad:* ${available}`
          }]);
      });
      flag = true
  }
  else{
    return fallBack('Búsqueda cancelada con el botón ⬇', null) 
  };

if (flag == true){
  pass()
} else{
  return fallBack(`No se en contro nigun producto con el nombre o marca ${search}`);
}

flowDynamic([{
  body :`Si estás interesado en algún producto escríbenos y pronto unos de nuestros trabajadores estará ayudándote en tu compra. 😉',
  '\n*Ejemplo:* Quiero comprar el destornillador de estria grande.`,
  buttons: [
    {
    body: 'Seguir buscando 🔎'
  },
  {
    body:  'Quiero hacer otra pregunta'
  }
]
}
])

});


const mainFlow = addKeyword(['hola', 'ole', 'alo', 'jola', 'buenos días', 'buenos dias', 'buenas noches', 'buenas tardes', 'hila', 'hol', 'hil', 'ola', 'ila', 'buenos dis'])
    .addAnswer(['¡Hola!, soy el asistente virtual de', '*El Serrucho*🪚.'])
    .addAnswer(['¿En qué puedo ayudarte? 🫡', " ", 'Selecciona una respuesta ⬇'], 
     {
        capture:true,
        buttons: [
            { body: 'Preguntar por un producto 🔎' },
            { body: 'Contactar con trabajador 👩‍💻' },   
            { body: 'Donde ubicarnos 📍' },
        ]
     }, (ctx, {flowDynamic}) => {

     }, [productFlow]);

const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: MONGO_DB_URI,
        dbName: MONGO_DB_NAME,
    })
    const adapterFlow = createFlow([productFlow, returnFlow, mainFlow])
    const adapterProvider = createProvider(BaileysProvider)
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })
    QRPortalWeb()
}

main()
