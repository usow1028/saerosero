export class DialogueUI {
  /**
   * @param {object} els
   * @param {HTMLElement} els.panel
   * @param {HTMLElement} els.speaker
   * @param {HTMLElement} els.text
   * @param {HTMLElement} els.interactionPanel
   * @param {HTMLElement} els.prompt
   * @param {HTMLElement} els.choices
   * @param {HTMLElement} els.minigameRoot
   */
  constructor(els) {
    this.els = els;
  }

  showLine(speaker, text) {
    this.els.panel.classList.remove('hidden');
    this.els.speaker.textContent = speaker;
    this.els.text.textContent = text;
  }

  hideDialogue() {
    this.els.panel.classList.add('hidden');
  }

  /**
   * @param {string} prompt
   * @param {{ choiceId: string, label: string }[]} choices
   * @param {(choiceId: string) => void} onPick
   */
  showChoices(prompt, choices, onPick) {
    this.els.interactionPanel.classList.remove('hidden');
    this.els.minigameRoot.classList.add('hidden');
    this.els.prompt.textContent = prompt;
    this.els.choices.innerHTML = '';

    for (const choice of choices) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = choice.label;
      btn.dataset.choiceId = choice.choiceId;
      btn.addEventListener('click', () => onPick(choice.choiceId));
      this.els.choices.appendChild(btn);
    }
  }

  /**
   * @param {HTMLElement} rootContent
   */
  showMinigame(rootContent) {
    this.els.interactionPanel.classList.remove('hidden');
    this.els.choices.innerHTML = '';
    this.els.prompt.textContent = '';
    this.els.minigameRoot.classList.remove('hidden');
    this.els.minigameRoot.innerHTML = '';
    this.els.minigameRoot.appendChild(rootContent);
  }

  hideInteraction() {
    this.els.interactionPanel.classList.add('hidden');
    this.els.choices.innerHTML = '';
    this.els.minigameRoot.classList.add('hidden');
    this.els.minigameRoot.innerHTML = '';
  }
}