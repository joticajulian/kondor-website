const fastify = require("fastify")({ logger: true });
const { Contract, Provider } = require("koilib");
const nicknamesAbi = require("./nicknames-abi.json");

const nick = new Contract({
  id: "1KD9Es7LBBjA1FY3ViCgQJ7e6WH1ipKbhz",
  abi: nicknamesAbi,
  provider: new Provider(["https://api.koinos.io"]),
}).functions;

const elementus = new Contract({
  id: "1EwJUW4BFbA4EGmSyB9bgdhB3gk2f3shRN",
  abi: nicknamesAbi,
  provider: new Provider(["https://api.koinos.io"]),
}).functions;

const validNames = [
  "Afghanistan",
  "Algeria",
  "Angola",
  "Argentina",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Benin",
  "Bolivia",
  "Brazil",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Croatia",
  "Cuba",
  "Czech Republic",
  "Denmark",
  "Dominican Republic",
  "DR Congo",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Ethiopia",
  "Finland",
  "France",
  "Germany",
  "Ghana",
  "Greece",
  "Guatemala",
  "Guinea",
  "Haiti",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "India",
  "Indonesia",
  "Iraq",
  "Iran",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Mali",
  "Mexico",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Nepal",
  "Netherlands",
  "Niger",
  "Nigeria",
  "North Korea",
  "Norway",
  "Pakistan",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Rebel Alliance",
  "Romania",
  "Russia",
  "Rwanda",
  "Saudi Arabia",
  "Senegal",
  "Singapore",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
]

async function getMetadata(id) {
  try {
    if (!/^(0x)?[0-9a-f]+$/i.test(id) || id.length % 2 !== 0)
      throw new Error("Invalid hexadecimal ID");
  } catch(error) {
    error.code = 400;
    error.response = {
      title: "Invalid ID",
      status: 400,
      detail: error.message,
    };
    throw error;
  }
  
  id = id.startsWith("0x") ? id.slice(2) : id;
  const name = Buffer.from(id, "hex").toString();

  if (!validNames.includes(name)) {
    const error = new Error("");
    error.code = 404;
    error.response = {
      title: "NFT not found",
      status: 404,
      detail: `the name '${name}' was not found in the list of NFTs`,
    };
    throw error;
  }

  return {
    name,
    description: `NFT of Kondor wallet dedicated to ${name}`,
    image: `https://koinosbox.com/nfts/${name.replace(" ","-")}-Kondor.png`
  };
}

fastify.get("/kondor-nfts", async (req, reply) => {
  const { id } = req.params;
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  reply.send(validNames.map(name => ({
    name,
    token_id: `0x${Buffer.from(name).toString("hex")}`,
  })));
});

fastify.get("/kondor-nfts/:id", async (req, reply) => {
  const { id } = req.params;
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  try {
    const metadata = await getMetadata(id);
    reply.send(metadata);
  } catch (error) {
    if (error.code && error.response) {
      reply.code(error.code);
      reply.send(error.response);
    } else {
      reply.code(500);
      reply.send("kondor nft internal server error");
    }
  }
});

fastify.get("/nicknames/:id", async (req, reply) => {
  const { id } = req.params;
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  try {
    const { result } = await nick.metadata_of({ token_id: id });
    reply.send(result.value);
  } catch (error) {
    if (error.code && error.response) {
      reply.code(error.code);
      reply.send(error.response);
    } else {
      reply.code(500);
      reply.send("kondor nft internal server error");
    }
  }
});

fastify.get("/kondor-elementus/:id", async (req, reply) => {
  const { id } = req.params;
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  try {
    const { result } = await elementus.metadata_of({ token_id: id });

    /**
     * temporal solution to reduce size
     */
    /*const metadata = JSON.parse(result.value);
    const newUrl = metadata.file_url.replace("/elementus/", "/elementus-small/");
    metadata.file_url = newUrl;
    metadata.image = newUrl;
    result.value = JSON.stringify(metadata);*/

    reply.send(result.value);
  } catch (error) {
    if (error.code && error.response) {
      reply.code(error.code);
      reply.send(error.response);
    } else {
      reply.code(500);
      reply.send("elementus internal server error");
    }
  }
});

const start = async () => {
  try {
    await fastify.listen(8080, "0.0.0.0");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
