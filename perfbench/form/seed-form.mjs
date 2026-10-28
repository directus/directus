// Seeds form_bench (~50 fields, detail + accordion groups) and form_bench_cond (same, plus 5 fields with conditions).
// Run against a COPY of bench.db: node seed-form.mjs http://127.0.0.1:8165
const B = process.argv[2] ?? "http://127.0.0.1:8165";
const login = await (
  await fetch(B + "/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "benchpass" }),
  })
).json();
const T = login.data.access_token;
async function api(method, path, body) {
  const r = await fetch(B + path, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + T,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(method + " " + path + " " + r.status + " " + t);
  return t ? JSON.parse(t) : null;
}

const pk = {
  field: "id",
  type: "integer",
  meta: { hidden: true },
  schema: { is_primary_key: true, has_auto_increment: true },
};
const group = (field, iface, group = null, options = {}) => ({
  field,
  type: "alias",
  meta: {
    interface: iface,
    special: ["alias", "no-data", "group"],
    group,
    options,
  },
  schema: null,
});
const choices = ["draft", "review", "published", "archived"].map((v) => ({
  text: v,
  value: v,
}));

function buildFields(withConditions) {
  const f = [pk];
  let sort = 1;
  const add = (field, type, iface, extra = {}) =>
    f.push({
      field,
      type,
      meta: { interface: iface, sort: sort++, width: "full", ...extra.meta },
      schema: extra.schema ?? {},
    });

  add("title", "string", "input");
  add("subtitle", "string", "input", { meta: { width: "half" } });
  add("slug", "string", "input", { meta: { width: "half" } });
  add("status", "string", "select-dropdown", {
    meta: { options: { choices }, width: "half" },
  });
  add("active", "boolean", "boolean", { meta: { width: "half" } });
  add("category", "integer", "select-dropdown-m2o", {
    meta: { special: ["m2o"], options: { template: "{{name}}" } },
  });
  add("config", "json", "input-code", {
    meta: { options: { language: "JSON" } },
  });

  f.push({
    ...group("g_basic", "group-detail"),
    meta: { ...group("g_basic", "group-detail").meta, sort: sort++ },
  });
  f.push({
    ...group("g_specs", "group-detail"),
    meta: { ...group("g_specs", "group-detail").meta, sort: sort++ },
  });
  f.push({
    ...group("g_more", "group-accordion"),
    meta: { ...group("g_more", "group-accordion").meta, sort: sort++ },
  });
  f.push({
    ...group("g_more_a", "group-detail", "g_more"),
    meta: { ...group("g_more_a", "group-detail", "g_more").meta, sort: sort++ },
  });
  f.push({
    ...group("g_more_b", "group-detail", "g_more"),
    meta: { ...group("g_more_b", "group-detail", "g_more").meta, sort: sort++ },
  });

  for (let i = 1; i <= 10; i++)
    add("basic_" + i, "string", "input", {
      meta: { group: "g_basic", width: i % 3 ? "half" : "full" },
    });
  add("basic_note", "text", "input-multiline", { meta: { group: "g_basic" } });
  add("basic_date", "dateTime", "datetime", {
    meta: { group: "g_basic", width: "half" },
  });
  add("basic_flag", "boolean", "boolean", {
    meta: { group: "g_basic", width: "half" },
  });

  for (let i = 1; i <= 4; i++)
    add("spec_int_" + i, "integer", "input", {
      meta: { group: "g_specs", width: "half" },
    });
  for (let i = 1; i <= 3; i++)
    add("spec_float_" + i, "float", "input", {
      meta: { group: "g_specs", width: "half" },
    });
  for (let i = 1; i <= 3; i++)
    add("spec_kind_" + i, "string", "select-dropdown", {
      meta: { group: "g_specs", width: "half", options: { choices } },
    });
  add("spec_toggle", "boolean", "boolean", {
    meta: { group: "g_specs", width: "half" },
  });

  for (let i = 1; i <= 6; i++)
    add("more_a_" + i, "string", "input", {
      meta: { group: "g_more_a", width: "half" },
    });
  add("more_a_date", "dateTime", "datetime", {
    meta: { group: "g_more_a", width: "half" },
  });
  add("more_a_text", "text", "input-multiline", {
    meta: { group: "g_more_a" },
  });
  for (let i = 1; i <= 5; i++)
    add("more_b_" + i, "string", "input", {
      meta: { group: "g_more_b", width: "half" },
    });
  add("more_b_date", "dateTime", "datetime", {
    meta: { group: "g_more_b", width: "half" },
  });
  add("more_b_flag", "boolean", "boolean", {
    meta: { group: "g_more_b", width: "half" },
  });

  if (withConditions) {
    const byName = Object.fromEntries(f.map((x) => [x.field, x]));
    const cond = (field, c) =>
      (byName[field].meta.conditions = [
        { name: "c", hidden: false, readonly: false, options: {}, ...c },
      ]);
    cond("slug", { rule: { title: { _contains: "abc" } }, readonly: true });
    cond("basic_3", { rule: { status: { _eq: "archived" } }, hidden: true });
    cond("spec_int_2", { rule: { active: { _eq: false } }, readonly: true });
    cond("more_a_2", { rule: { title: { _empty: true } }, required: true });
    cond("spec_kind_1", {
      rule: { status: { _eq: "draft" } },
      options: { choices: choices.slice(0, 2) },
    });
  }

  return f;
}

for (const [collection, withConditions] of [
  ["form_bench", false],
  ["form_bench_cond", true],
]) {
  await api("POST", "/collections", {
    collection,
    meta: {},
    schema: {},
    fields: buildFields(withConditions),
  });
  await api("POST", "/relations", {
    collection,
    field: "category",
    related_collection: "bench_categories",
  });
  const item = {
    title: "Hello",
    subtitle: "sub",
    slug: "hello",
    status: "review",
    active: true,
    category: 3,
    config: { a: 1, b: [1, 2, 3], c: { d: "x" } },
  };
  for (let i = 1; i <= 10; i++) item["basic_" + i] = "basic " + i;
  for (let i = 1; i <= 4; i++) item["spec_int_" + i] = i * 10;
  item.basic_date = "2024-05-01T10:00:00";
  item.more_a_text = "some longer text\nwith lines";
  await api("POST", "/items/" + collection, item);
  const fields = (await api("GET", "/fields/" + collection)).data.length;
  console.log("seeded", collection, fields, "fields");
}
