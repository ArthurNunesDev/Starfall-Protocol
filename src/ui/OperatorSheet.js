const CATEGORY_LABELS = Object.freeze({
  ofensiva: "Ofensiva",
  defensiva: "Defensiva",
  mobilidade: "Mobilidade",
  passiva: "Passiva",
});

function createElement(tag, className = "", text = null) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== null) element.textContent = String(text);
  return element;
}

function renderStats(stats) {
  const list = createElement("dl", "operator-sheet__stats");
  for (const item of stats) {
    list.append(
      createElement("dt", "", item.label),
      createElement("dd", "", item.value),
    );
  }
  return list;
}

function renderSection(title, ...children) {
  const section = createElement("section", "operator-sheet__section");
  section.append(createElement("h3", "operator-sheet__section-title", title), ...children);
  return section;
}

function renderCard(ability) {
  const card = createElement("article", `operator-ability operator-ability--${ability.category}`);
  const header = createElement("header", "operator-ability__header");
  header.append(
    createElement("h4", "operator-ability__name", ability.name),
    createElement("span", "operator-ability__category", CATEGORY_LABELS[ability.category] ?? "Habilidade"),
  );
  if (ability.key) header.append(createElement("kbd", "operator-ability__key", ability.key));
  card.append(header, createElement("p", "operator-ability__description", ability.description), renderStats(ability.stats));
  return card;
}

function renderUltimate(ultimate) {
  const section = createElement("section", "operator-sheet__section operator-sheet__section--ultimate");
  section.append(createElement("h3", "operator-sheet__section-title", "Ultimate"));

  const card = createElement("article", "operator-ability operator-ability--ultimate");
  const header = createElement("header", "operator-ability__header");
  header.append(
    createElement("h4", "operator-ability__name", ultimate.name),
    createElement("kbd", "operator-ability__key", ultimate.key),
  );
  card.append(header, createElement("p", "operator-ability__description", ultimate.description));

  const charge = createElement("div", "operator-charge");
  charge.setAttribute("role", "img");
  charge.setAttribute("aria-label", "Escala de carga: até 5 segundos, carga normal; acima de 5 segundos, laser vermelho.");
  const track = createElement("div", "operator-charge__track");
  for (const phase of ultimate.phases) {
    const segment = createElement("div", `operator-charge__phase operator-charge__phase--${phase.color}`, phase.label);
    segment.style.flex = String(phase.to - phase.from);
    track.append(segment);
  }
  const scale = createElement("div", "operator-charge__scale");
  scale.append(createElement("span", "", "0 s"), createElement("span", "", "5 s"), createElement("span", "", "10 s"));
  charge.append(track, scale);
  card.append(charge, renderStats(ultimate.stats));

  const buff = createElement("section", "operator-buff");
  buff.append(
    createElement("h5", "operator-buff__title", `Buff por ${ultimate.buff.duration} segundos`),
    createElement("p", "operator-buff__trigger", `Ativação: ${ultimate.buff.trigger}.`),
    renderStats(ultimate.buff.effects),
    createElement("p", "operator-buff__end", ultimate.buff.end),
  );
  card.append(buff);
  section.append(card);
  return section;
}

function renderOperator(operator) {
  const article = createElement("article", "operator-sheet");
  article.setAttribute("aria-label", `Ficha de ${operator.name}`);

  const header = createElement("header", "operator-sheet__header");
  const portrait = createElement("span", "operator-sheet__portrait");
  portrait.setAttribute("aria-hidden", "true");
  const identity = createElement("div", "operator-sheet__identity");
  identity.append(
    createElement("h2", "operator-sheet__name", operator.name),
    createElement("p", "operator-sheet__class", `CLASSE // ${operator.className}`),
    createElement("p", "operator-sheet__summary", operator.summary),
  );
  header.append(portrait, identity);

  const body = createElement("div", "operator-sheet__body");
  const left = createElement("div", "operator-sheet__column");
  const right = createElement("div", "operator-sheet__column");

  left.append(
    renderSection("Atributos", renderStats(operator.attributes)),
    renderSection("Arma", createElement("h4", "operator-sheet__weapon-name", operator.weapon.name),
      createElement("p", "operator-sheet__description", operator.weapon.description),
      renderStats([
        { label: "Dano por disparo", value: operator.weapon.damage },
        { label: "Intervalo entre disparos", value: `${operator.weapon.interval} s` },
        { label: "Alcance de aquisição", value: `${operator.weapon.targetRange} unidades` },
        { label: "Alcance do projétil", value: `${operator.weapon.projectileRange} unidades` },
        { label: "Dano teórico por segundo", value: (operator.weapon.damage / operator.weapon.interval).toFixed(2).replace(".", ",") },
      ])),
    renderSection("Habilidades passivas", ...operator.passives.map(renderCard)),
  );

  right.append(
    renderUltimate(operator.ultimate),
    renderSection("Habilidades ativas", ...operator.abilities.map(renderCard)),
  );
  body.append(left, right);
  article.append(header, body);
  return article;
}

export class OperatorSheet {
  #container;

  constructor(container) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError("OperatorSheet exige um elemento HTML válido.");
    }
    this.#container = container;
  }

  show(operator) {
    if (!operator || typeof operator.name !== "string" || !Array.isArray(operator.abilities)) {
      throw new TypeError("Dados inválidos para renderizar a ficha do operador.");
    }
    this.#container.replaceChildren(renderOperator(operator));
  }

  clear() {
    this.#container.replaceChildren();
  }
}
