import { writeNote, client } from "./src/notes/store.js";

async function run() {
  console.log("Writing note...");
  const note = await writeNote("test_user", {
    content: "The Earth is the third planet from the Sun. It revolves around the Sun.",
  });
  console.log("Note written:", note.id);
  const entities = await client.execute("SELECT * FROM entities");
  const relations = await client.execute("SELECT * FROM entity_relations");
  console.log("Entities:", entities.rows);
  console.log("Relations:", relations.rows);
  process.exit(0);
}

run().catch(console.error);
