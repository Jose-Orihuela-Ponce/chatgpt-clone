import { CreateWebWorkerMLCEngine } from 'https://esm.run/@mlc-ai/web-llm';

function getElement(el) {
  return document.querySelector(el);
}
const formElement = getElement('form');
const inputElement = getElement('input');
const ulContainerElement = getElement('ul');
const mainElement = getElement('main');
const buttonElement = getElement('button');
const templateElement = getElement('#message-template');
const progressElement = getElement('.progress');

let modelLoaded = 0;
const messages = [];
formElement.addEventListener('submit', onSubmit);
const SELECTED_MODEL = 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC';
const engine = await CreateWebWorkerMLCEngine(
  new Worker(new URL('./worker.js', import.meta.url), {
    type: 'module'
  }),
  SELECTED_MODEL,
  {
    initProgressCallback: (initProgress) => {
      progressElement.innerText = initProgress.text;
      modelLoaded = initProgress.progress;
    }
  }
);

if (modelLoaded === 1) {
  buttonElement.removeAttribute('disabled');
  buttonElement.innerText = 'Send';
}

async function onSubmit(e) {
  e.preventDefault();
  const messageText = inputElement.value.trim();

  if (messageText == '') return;

  addMessage(messageText, 'user');
  inputElement.value = '';

  buttonElement.setAttribute('disabled', true);

  const userMessage = {
    role: 'user',
    content: messageText
  };

  messages.push(userMessage);
  const chunks = await engine.chat.completions.create({
    messages,
    stream: true
  });

  let reply = '';
  const botMessageContent = addMessage('...', 'GPT');

  for await (const chunk of chunks) {
    const choice = chunk.choices[0];
    const content = choice?.delta?.content ?? '';
    reply += content;
    botMessageContent.textContent = reply;
    ulContainerElement.scrollTop = ulContainerElement.scrollHeight;
  }
  buttonElement.removeAttribute('disabled');

  messages.push({
    role: 'assistant',
    content: reply
  });
}

function addMessage(text, sender) {
  const clonedTemplate = templateElement.content.cloneNode(true);
  const newMessageeElement = clonedTemplate.querySelector('.message');

  const whoContainer = newMessageeElement.querySelector('span');
  const textContainer = newMessageeElement.querySelector('p');

  textContainer.textContent = text;
  whoContainer.textContent = sender == 'user' ? 'Tu' : 'GPT';
  newMessageeElement.classList.add(sender);

  ulContainerElement.appendChild(newMessageeElement);

  ulContainerElement.scrollTop = ulContainerElement.scrollHeight;

  return textContainer;
}
