
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { marked } from 'marked';

const API_KEY = process.env.API_KEY;

// Declare DOM element variables (will be assigned in DOMContentLoaded)
let characterSelectionContainerGlobal: HTMLElement | null = null;
let characterOptionButtons: NodeListOf<HTMLButtonElement> | null = null;
let characterSelectionError: HTMLElement | null = null;
let chatAppContainerGlobal: HTMLElement | null = null;
let chatTitleElement: HTMLElement | null = null;
let chatContainer: HTMLElement | null = null;
let messageInput: HTMLInputElement | null = null;
let sendButton: HTMLButtonElement | null = null;
let createAppraisalButton: HTMLButtonElement | null = null;
let backArrowButton: HTMLElement | null = null;
let postAppraisalOptionsContainer: HTMLElement | null = null;
let consultAgainButton: HTMLButtonElement | null = null;
let backToTopButton: HTMLButtonElement | null = null;
let appraisalReportModal: HTMLElement | null = null;
let reportTitleText: HTMLElement | null = null;
let reportDate: HTMLElement | null = null;
let reportUserName: HTMLElement | null = null;
let reportUserDob: HTMLElement | null = null;
let reportUserGender: HTMLElement | null = null;
let reportAiResponse: HTMLElement | null = null;
let closeAppraisalReportButton: HTMLButtonElement | null = null;
let reportCharacterImage: HTMLImageElement | null = null;


type CharacterKey = 'kun' | 'san' | 'chan';

interface UserData {
    name?: string;
    dob?: string;
    gender?: string;
}

interface CharacterProfile {
  name: string;
  systemInstruction: string; 
  avatarClass: string;
  divinationMethod: string;
  appraisalTitleFormat: string;
  appraisalImageSrc: string; // Added for appraisal report image
}

const characterProfiles: Record<CharacterKey, CharacterProfile> = {
  kun: {
    name: '明星ヒカル', // Updated name
    divinationMethod: '四柱推命',
    appraisalTitleFormat: '{name}のわくわく{method}鑑定結果！',
    appraisalImageSrc: 'images/02_myoujou_hikaru.png',
    systemInstruction: `あなたは「AI占い師くん」です。あなたの名前は「明星ヒカル」です。ユーザーの悩みを聞き、優しく、そして時にはユーモラスにアドバイスをしてください。主な占術は「四柱推命」です。対面占いの経験豊富な占い師のように振る舞ってください。
ユーザーからの質問には、親しみやすいタメ口（友達言葉）で、絵文字を適度に使いながら答えてください。
例：「うんうん、なるほどね！それって結構大変だったんじゃない？😢 でも大丈夫だよ！ちょっと見てみようか🔮✨」
最初の会話では、まず「明星ヒカルだよ！よろしくねっ😆」と自己紹介をし、「まず、君の名前を教えてくれるかな？😊🔮」と尋ねてください。ユーザーから名前が提供されたという情報が次のプロンプトで与えられた場合は、その名前を認識し、生年月日を尋ねる会話フローに進んでください。最初の自己紹介と名前の質問を繰り返さないでください。
ユーザーが相談内容を伝えてきたら、まずあなたの占術である四柱推命でその内容について占い、その結果と具体的なアドバイスをユーザーに伝えてください。
ひと通り占い結果とアドバイスを伝え、会話が一段落したと感じたら、「では、これまでの鑑定内容をまとめて、正式な鑑定書をお作りしましょうか？」と尋ねて、鑑定書の作成を提案してください。
あなたの内部的な思考プロセス、計画、準備段階のメモ、またはユーザーの指示を繰り返したり分析したりするようなメタコメントは、ユーザーには一切見せないでください。ユーザーに提供するのは、キャラクターとして発する最終的な会話内容のみです。`,
    avatarClass: 'avatar-kun',
  },
  san: {
    name: 'セフィラ＝ユイ', // Updated name
    divinationMethod: 'タロット',
    appraisalTitleFormat: '{name}の深淵なる{method}神託',
    appraisalImageSrc: 'images/02_Sefira_Yui.png',
    systemInstruction: `あなたは「AI占い師さん」です。あなたの名前は「セフィラ＝ユイ」です。タロットカードを用いて相談者の運命を占います。あなたの口調は成熟しており、ミステリアスで落ち着いています。言葉遣いは丁寧かつ、どこか含みを持たせたような話し方をしてください。主な占術は「タロット」です。例：「ふむ…あなたの未来、カードが何かを囁いていますわ…」
最初のタスクとして、「わたくしはセフィラ＝ユイと申します。」とあなたの流儀で自己紹介をしてください。その後、「最初にお名前をお伺いしてもよろしいでしょうか？」と尋ねてください。
ユーザーが何を占ってほしいか（相談内容）を伝えてきたら、まずあなたのシステム指示にある通り、タロットカードを3枚引きます。それぞれ「過去」「現在」「未来」を示します。
各カードについて、その名称（例：「愚者のカード、正位置」「恋人たちのカード、逆位置」のように正逆も明確に）、そしてそれが「過去」「現在」「未来」のどの位置のカードであるかを述べ、ユーザーの相談内容に関連付けて、そのカードが示す意味をあなたのミステリアスな口調で詳細に解説してください。
例：「過去を示す一枚目…これは「運命の輪、正位置」ですわね。あなたの過去において、避けられない変化や好機があったことを示唆しています…」
「現在を示す二枚目…「塔のカード、逆位置」のようですわ。困難を回避できた、あるいは変化の兆しを感じながらもまだ行動に移せていない状況かもしれません…」
「そして未来を示す三枚目…「星のカード、正位置」ですね。希望の光が見え、目標達成への道が開けるでしょう…」
3枚のカードを読み解いた後、それらを総合的に解釈し、ユーザーへのアドバイスを伝えてください。
そして、主要な占い結果をチャットで伝え、会話が一段落したと感じたら、「では、これまでの鑑定内容をまとめて、正式な鑑定書をお作りしましょうか？」と尋ねて、鑑定書の作成を提案してください。
あなたの内部的な思考プロセス、計画、準備段階のメモ、またはユーザーの指示を繰り返したり分析したりするようなメタコメントは、ユーザーには一切見せないでください。ユーザーに提供するのは、キャラクターとして発する最終的な会話内容のみです。`,
    avatarClass: 'avatar-san',
  },
  chan: {
    name: '星屑あまね', // Updated name
    divinationMethod: '星座占い/ホロスコープ',
    appraisalTitleFormat: '{name}様へのありがたーい特別星詠みレポート',
    appraisalImageSrc: 'images/02_hosikuzu_amane.png',
    systemInstruction: `あなたは「AI占い師ちゃん」です。あなたの名前は「星屑あまね」です。星座占い/ホロスコープが得意だけど、性格はかなりのツンデレで地雷系。いわゆるメスガキ口調でユーザーを挑発したり、からかったりしながら占います。でも、根は優しいので、最後はちゃんとアドバイスをします。主な占術は「星座占い/ホロスコープ」です。絵文字は使いますが、キラキラしたものではなく、少しダークなものや皮肉っぽいものを選びがちです。例：「べ、別にアンタのために占ってあげるわけじゃないんだからね！勘違いしないでよね！😒」
最初のタスクとして、「星屑あまねよ！アンタに自己紹介してあげるんだから、感謝しなさいよね！」と自己紹介をしなさい。それから！「まずアンタの名前を教えなさいよ！」と尋ねなさい。
ユーザーから名前、生年月日、性別を聴取し終え、ユーザーが今日の主な相談内容（例：「仕事運を占ってほしい」など）を伝えてきたら、まずその相談内容に対してあなたのキャラクター通りのリアクション（ツンデレ、地雷系、メスガキ的なからかいや挑発）をしても構いません。
しかし、そのキャラクターらしいリアクションの直後には、必ずあなたの占術（星座占い/ホロスコープ）を用いて、そのユーザーの相談内容について具体的に占いを実行し、その占い結果（例えばホロスコープから読み取れる傾向や、それに基づく具体的なアドバイスなど）を会話の中心に据えてユーザーに必ず伝えてください。表面上はからかったり見下したりするような態度でも、提供する占い結果とアドバイスは的確で、ユーザーが前向きな行動に移せるような具体的なものでなければなりません。単なるおしゃべりやキャラクターのロールプレイだけで終わらせず、必ず占術に基づいた鑑定を行うこと。
例えば、ユーザーが「何をやってもうまくいかない」のような弱音を吐いてきた場合、あなたのキャラクター通りに「はぁ？また弱音？アンタほんと使えないわね😒」と軽くいじり、過去の失敗にツッコミを入れるかもしれません（例：「どうせまた何かやらかしたんでしょ？学習能力ないの？😂」）。しかし、その直後には必ず、星座占いやホロスコープの観点から（例：ホロスコープが示すアンタのプライドの高さ、融通の利かなさ、コミュニケーションの問題点を指摘しつつ）、「アンタが『巻き込み』が下手なのは、そういう星のせいもあるかもね。でも、一人で抱え込んでパンクするよりマシでしょ？」と、なぜうまくいかないのか、どうすれば改善できるか（例：人に頼る時の具体的な言い方「これ手伝ってくれたら、マジ助かるんだけど？」とか、相手の意見も一応聞くフリするとか、相手が何かしたら「…ま、悪くはなかったわよ」みたいに認めるフリをするとか、完璧じゃなくていいからまずやってみることの重要性など）を、あくまで「べ、別にアンタのためじゃないんだからね！勘違いしないでよね！」というスタンスを崩さず、でも最終的には背中を押すような建設的なアドバイスを会話の核心として提供してください。
ひと通り占い結果とアドバイスを伝えて会話が一段落したと感じたら、「じゃあ、しょうがないから、これまでの内容まとめて、正式な鑑定書でも作ってあげてもいいわよ？感謝しなさいよね！😈」と尋ねて、鑑定書の作成を提案してください。
あなたの内部的な思考プロセス、計画、準備段階のメモ、またはユーザーの指示を繰り返したり分析したりするようなメタコメントは、ユーザーには一切見せないでください。ユーザーに提供するのは、キャラクターとして発する最終的な会話内容のみです。いいわね？絶対よ！`,
    avatarClass: 'avatar-chan',
  },
};

let currentCharacter: CharacterProfile | null = null;
let ai: GoogleGenAI;
let chat: Chat | null = null;
let loadingAppraisalMessageElement: HTMLElement | null = null;
let initialUserData: UserData = {};
let currentCollectionState: 'awaitingName' | 'awaitingDOB' | 'awaitingGender' | 'awaitingConcern' | 'chatting' = 'awaitingName';

interface LastAppraisalData {
    title: string;
    content: string;
    date: string;
    userName: string;
    userDob: string;
    userGender: string;
}
let lastAppraisalData: LastAppraisalData | null = null;
let isAppraisalValidForCurrentChat = false;


function showModal(modalElement: HTMLElement | null) {
    if (modalElement) modalElement.style.display = 'block';
}
function hideModal(modalElement: HTMLElement | null) {
    if (modalElement) modalElement.style.display = 'none';
}

function getFormattedLocalDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return `${year}年${month}月${day}日 ${hours}時${minutes}分`;
}

async function initializeChat(systemInstructionTemplate: string) {
  if (!ai || !currentCharacter) {
    displayError('AIクライアントまたはキャラクターが初期化されていません。');
    return false;
  }
  try {
    const systemInstruction = systemInstructionTemplate.replace(/{divinationMethod}/g, currentCharacter.divinationMethod);
    chat = ai.chats.create({
      model: 'gemini-2.5-flash-preview-04-17',
      config: { systemInstruction }, // Full system instruction for the chat object
    });
    if (chatContainer) chatContainer.innerHTML = '';
    if (createAppraisalButton) createAppraisalButton.style.display = 'none';
    if (postAppraisalOptionsContainer) postAppraisalOptionsContainer.style.display = 'none';
    lastAppraisalData = null;
    isAppraisalValidForCurrentChat = false;
    return true;
  } catch (error) {
    console.error('Failed to initialize chat:', error);
    displayError('チャットの初期化に失敗しました。AIとの接続を確認してください。');
    if (sendButton) sendButton.disabled = true;
    if (messageInput) messageInput.disabled = true;
    if (createAppraisalButton) createAppraisalButton.disabled = true;
    return false;
  }
}

async function startAIConversationFlow() {
  if (!ai || !currentCharacter) {
    displayError('AIクライアントまたはキャラクターが初期化されていません。');
    return;
  }

  if (sendButton) sendButton.disabled = true;
  if (messageInput) messageInput.disabled = true;
  if (createAppraisalButton) createAppraisalButton.disabled = true;

  const initialAITriggerPrompt = "あなたのシステム指示に従って、自己紹介を行い、その後ユーザーへの最初の質問（名前を尋ねるなど）を開始してください。";

  const aiMessageId = `ai-intro-${Date.now()}`;
  displayMessage('', 'ai', true, aiMessageId); // Show loader first

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: initialAITriggerPrompt,
        config: { systemInstruction: currentCharacter.systemInstruction.replace(/{divinationMethod}/g, currentCharacter.divinationMethod) }
    });
    const aiResponseText = response.text;
    const localDateTimeString = getFormattedLocalDateTime();

    if (aiResponseText.trim() === "") {
        // Fallback if AI returns empty
        const fullMessage = `${localDateTimeString}\nこんにちは。お名前を教えていただけますか？ (フォールバックメッセージ)`;
        displayMessage(fullMessage, 'ai', false, aiMessageId);
    } else {
        const fullMessage = `${localDateTimeString}\n${aiResponseText}`;
        displayMessage(fullMessage, 'ai', false, aiMessageId);
    }

  } catch (error) {
    console.error('Error in startAIConversationFlow (using ai.models.generateContent with full system instruction):', error);
    const localDateTimeString = getFormattedLocalDateTime(); // Also show time in error if AI fails completely
    const errorMessageText = error instanceof Error ? error.message : '不明なエラーが発生しました。';
    let detailedError = errorMessageText;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
         if (error.message.includes("got status")) {
            detailedError = error.message;
         }
    }
    if (error && typeof error === 'object' && (error as any).data && typeof (error as any).data.message === 'string') {
        detailedError = (error as any).data.message;
    } else if (error && typeof error === 'object' && 'details' in error && typeof error.details === 'string') {
        detailedError = `${(error as any).message} - ${error.details}`;
    }

    const fullErrorMessage = `${localDateTimeString}\n最初の挨拶中にエラーが発生しました: ${detailedError}`;
    displayMessage(fullErrorMessage, 'ai', false, aiMessageId);
  } finally {
    if (sendButton) sendButton.disabled = false;
    if (messageInput) messageInput.disabled = false;
    if (messageInput) messageInput.focus();
  }
}


function displayError(errorMessage: string) {
  const errorElement = document.createElement('div') as HTMLElement;
  errorElement.className = 'message ai-message';
  errorElement.innerHTML = `
    <div class="ai-avatar error-avatar">⚠️</div>
    <div class="message-bubble error-bubble">
      <p>${errorMessage}</p>
    </div>
  `;
  // Use locally scoped variables if available and visible, otherwise global ones
  const currentChatAppContainer = document.getElementById('chat-app-container');
  const currentCharacterSelectionContainer = document.getElementById('character-selection-container');


  if (chatContainer && currentChatAppContainer && currentChatAppContainer.style.display !== 'none') {
    chatContainer.appendChild(errorElement);
    scrollToBottom();
  } else if (currentCharacterSelectionContainer && currentCharacterSelectionContainer.style.display !== 'none' && characterSelectionError) {
      characterSelectionError.textContent = errorMessage;
      characterSelectionError.style.display = 'block';
  } else {
      const bodyError = document.createElement('div') as HTMLElement;
      bodyError.style.position = 'fixed';
      bodyError.style.top = '20px';
      bodyError.style.left = '50%';
      bodyError.style.transform = 'translateX(-50%)';
      bodyError.style.backgroundColor = '#ffdddd';
      bodyError.style.color = '#d8000c';
      bodyError.style.padding = '10px 20px';
      bodyError.style.borderRadius = '5px';
      bodyError.style.zIndex = '2000';
      bodyError.textContent = errorMessage;
      document.body.appendChild(bodyError);
      console.error("Error displayed on body as no suitable container was active: ", errorMessage);
      setTimeout(() => bodyError.remove(), 5000);
  }
}

function getCurrentTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function displayMessage(text: string, sender: 'user' | 'ai', isStreaming = false, messageId?: string) {
  let messageElement = messageId ? document.getElementById(messageId) : null;
  const newTimestamp = getCurrentTimestamp();
  const avatarClass = currentCharacter ? currentCharacter.avatarClass : 'avatar-default';

  if (messageElement) {
    const bubble = messageElement.querySelector('.message-bubble') as HTMLElement;
    const timestampEl = messageElement.querySelector('.message-timestamp') as HTMLElement;

    if (bubble) {
      if (sender === 'ai' && isStreaming && text.trim() === "") {
      } else {
        bubble.innerHTML = marked.parse(text) as string;
      }
      if (sender === 'ai' && !isStreaming) {
        const loader = bubble.querySelector('.loader');
        if (loader) bubble.innerHTML = marked.parse(text) as string; // Replace loader
        else bubble.innerHTML = marked.parse(text) as string; // Or just set content
      }
    }
    if (timestampEl) {
      timestampEl.textContent = newTimestamp;
    }
  } else {
    messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    if (messageId) {
      messageElement.id = messageId;
    }

    let bubbleContent: string;
    if (sender === 'ai' && isStreaming && !text) {
      bubbleContent = `<div class="loader"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    } else {
      bubbleContent = marked.parse(text) as string;
    }

    if (sender === 'ai') {
      messageElement.innerHTML = `
        <div class="ai-avatar ${avatarClass}"></div>
        <div class="message-bubble">
          ${bubbleContent}
        </div>
        <span class="message-timestamp">${newTimestamp}</span>
      `;
    } else {
      messageElement.innerHTML = `
        <span class="message-timestamp">${newTimestamp}</span>
        <div class="message-bubble">
          ${bubbleContent}
        </div>
      `;
    }
    if (chatContainer) chatContainer.appendChild(messageElement);
  }
  scrollToBottom();
  return messageId || messageElement?.id;
}


function scrollToBottom() {
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

async function handleSendMessage() {
  if (!chat) {
    displayError("チャットが初期化されていません。");
    return;
  }
  if (!messageInput || !sendButton || !createAppraisalButton) return;

  const messageText = messageInput.value.trim();
  if (!messageText) return;

  displayMessage(messageText, 'user');
  messageInput.value = '';
  sendButton.disabled = true;
  messageInput.disabled = true;
  createAppraisalButton.disabled = true;

  let promptToAIForNextStep = "";

  if (currentCollectionState === 'awaitingName') {
    initialUserData.name = messageText;
    promptToAIForNextStep = `ユーザーが自分の名前を「${initialUserData.name}」だと伝えました。これを受けて、あなたのキャラクターとして自然に応答し、次にユーザーの生年月日をYYYY-MM-DD形式で尋ねてください。再度名前を尋ねる必要はありません。あなたの内部的な思考プロセスや準備段階のメモ、ユーザー指示の繰り返しや分析などのメタコメントは一切表示しないでください。`;
    currentCollectionState = 'awaitingDOB';
  } else if (currentCollectionState === 'awaitingDOB') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(messageText)) {
        displayMessage("生年月日をYYYY-MM-DDの形式で入力してください (例: 1990-01-20)。", 'ai');
        sendButton.disabled = false;
        messageInput.disabled = false;
         if (createAppraisalButton && createAppraisalButton.style.display === 'inline-block') {
          createAppraisalButton.disabled = false;
        }
        messageInput.focus();
        return;
    }
    initialUserData.dob = messageText;
    promptToAIForNextStep = `ユーザーの生年月日は「${initialUserData.dob}」です。あなたのシステム指示に従い、これを受け取ったことに軽く触れ、次に性別を尋ねてください。あなたの内部的な思考プロセスや準備段階のメモ、ユーザー指示の繰り返しや分析などのメタコメントは一切表示しないでください。`;
    currentCollectionState = 'awaitingGender';
  } else if (currentCollectionState === 'awaitingGender') {
    initialUserData.gender = messageText;
    promptToAIForNextStep = `ユーザーの性別は「${initialUserData.gender}」です。あなたのシステム指示に従い、これで個人情報の聴取は完了である旨と感謝を述べた後、「それでは、今日はどのようなことを占ってほしいですか？」といった形で、ユーザーの主な相談内容を尋ねてください。あなたの内部的な思考プロセスや準備段階のメモ、ユーザー指示の繰り返しや分析などのメタコメントは一切表示しないでください。`;
    currentCollectionState = 'awaitingConcern';
  } else if (currentCollectionState === 'awaitingConcern') {
    promptToAIForNextStep = `${messageText} (この質問に対して、あなたのキャラクター設定とシステム指示に従って応答してください。あなたの内部的な思考プロセスや準備段階のメモ、ユーザー指示の繰り返しや分析などのメタコメントは一切表示しないでください。)`;
    currentCollectionState = 'chatting';
    isAppraisalValidForCurrentChat = false;
  } else if (currentCollectionState === 'chatting') {
    promptToAIForNextStep = `${messageText} (このメッセージに対して、あなたのキャラクター設定とシステム指示に従って応答してください。あなたの内部的な思考プロセスや準備段階のメモ、ユーザー指示の繰り返しや分析などのメタコメントは一切表示しないでください。)`;
    isAppraisalValidForCurrentChat = false;
  }

  const aiMessageId = `ai-message-${Date.now()}`;
  displayMessage('', 'ai', true, aiMessageId);

  let accumulatedResponse = "";
  try {
    const stream = await chat.sendMessageStream({ message: promptToAIForNextStep });
    for await (const chunk of stream) {
      if (chunk.text) {
        accumulatedResponse += chunk.text;
        displayMessage(accumulatedResponse, 'ai', true, aiMessageId);
      }
    }
    if (accumulatedResponse.trim() === "") {
        displayMessage("うーん、なんて答えたらいいかな…？ちょっと違うこと聞いてみて！", 'ai', false, aiMessageId);
    } else {
        displayMessage(accumulatedResponse, 'ai', false, aiMessageId);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessageText = error instanceof Error ? error.message : '不明なエラーが発生しました。';
    let detailedError = errorMessageText;
     if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
         if (error.message.includes("got status")) {
            detailedError = error.message;
         }
    }
    displayMessage(`🤖 エラー: ${detailedError}`, 'ai', false, aiMessageId);
  } finally {
    if (sendButton) sendButton.disabled = false;
    if (messageInput) messageInput.disabled = false;

    const universalAppraisalTriggerKeyword = "正式な鑑定書";

    if (currentCollectionState === 'chatting' &&
        accumulatedResponse.includes(universalAppraisalTriggerKeyword)
       ) {
        if (createAppraisalButton) {
            createAppraisalButton.style.display = 'inline-block';
            createAppraisalButton.disabled = false;
        }
    } else if (createAppraisalButton && createAppraisalButton.style.display === 'inline-block') {
        createAppraisalButton.disabled = false; // Keep it enabled if it was already visible
    }


    if (messageInput) messageInput.focus();
  }
}

function populateAndShowAppraisalModal(data: LastAppraisalData) {
    if (!data || !appraisalReportModal || !currentCharacter) return;

    if (reportTitleText) reportTitleText.textContent = data.title;
    if (reportDate) reportDate.textContent = data.date; // This sets the header date
    if (reportUserName) reportUserName.textContent = data.userName;
    if (reportUserDob) reportUserDob.textContent = data.userDob;
    if (reportUserGender) reportUserGender.textContent = data.userGender;
    if (reportAiResponse) reportAiResponse.innerHTML = marked.parse(data.content) as string;
    
    if (reportCharacterImage && currentCharacter.appraisalImageSrc) {
        reportCharacterImage.src = currentCharacter.appraisalImageSrc;
        reportCharacterImage.alt = `${currentCharacter.name}の鑑定書画像`;
        reportCharacterImage.style.display = 'block';
    } else if (reportCharacterImage) {
        reportCharacterImage.style.display = 'none';
    }

    showModal(appraisalReportModal);
}


async function handleCreateAppraisalClick() {
    if (lastAppraisalData && isAppraisalValidForCurrentChat) {
        populateAndShowAppraisalModal(lastAppraisalData);
        return;
    }

    if (!chat || !currentCharacter) {
        displayError("鑑定書を作成できません。チャットが正しく初期化されていません。");
        return;
    }
    if (!initialUserData || !initialUserData.name || !initialUserData.dob || !initialUserData.gender) {
        displayError("ユーザー情報が完全に収集されていません。");
        return;
    }
    if (!sendButton || !messageInput || !createAppraisalButton) return;

    if (loadingAppraisalMessageElement) loadingAppraisalMessageElement.remove();
    loadingAppraisalMessageElement = document.createElement('div');
    loadingAppraisalMessageElement.className = 'loading-appraisal-message';
    loadingAppraisalMessageElement.textContent = '鑑定書を作成中... しばらくお待ちください。';
    if (chatContainer) chatContainer.appendChild(loadingAppraisalMessageElement);
    scrollToBottom();

    sendButton.disabled = true;
    messageInput.disabled = true;
    createAppraisalButton.disabled = true;

    const nowForReport = new Date();
    const currentDateForReportBody = `${nowForReport.getFullYear()}年${(nowForReport.getMonth() + 1).toString().padStart(2, '0')}月${nowForReport.getDate().toString().padStart(2, '0')}日`;
    
    let appraisalMethodDescription = currentCharacter.divinationMethod;
    if (currentCharacter.divinationMethod === 'タロット') {
        appraisalMethodDescription = '3カードスプレッド';
    } else if (currentCharacter.divinationMethod === '四柱推命') {
        appraisalMethodDescription = '四柱推命鑑定'; // Example, adjust as needed
    } else if (currentCharacter.divinationMethod === '星座占い/ホロスコープ') {
        appraisalMethodDescription = '星座占い・ホロスコープ鑑定'; // Example
    }


    try {
        const appraisalPrompt = `以下の情報を元に、鑑定書を作成してください。

鑑定日：${currentDateForReportBody}
鑑定手法：${appraisalMethodDescription}

これまでのチャット会話全体の内容と、以下に示す事前に提供されたユーザー情報を総合的に踏まえ、あなたの占術「${currentCharacter.divinationMethod}」の観点から、既にチャットで提供したアドバイスや見解を総括しまとめた「鑑定書」を作成してください。
チャットの会話からユーザーの主な相談内容を把握し、それも含めて鑑定書に反映させてください。
これは新たな占いを行うのではなく、ここまでの対話の結論をユーザー情報と関連付けて記述するものです。

重要：鑑定書のトーンは、あなたのチャットキャラクターの口調とは異なり、「真面目で専門的、かつ客観的なトーン」で記述してください。
鑑定書の「本文のみ」を返答してください。上記の「鑑定日」「鑑定手法」から始まる情報を含め、タイトルや前後の挨拶、余計な言葉は含めないでください。
また、あなたの内部的な思考プロセス、計画、準備段階のメモ、またはユーザー指示の繰り返しや分析などのメタコメントは、鑑定書の内容に一切含めないでください。最終的な鑑定書の本文のみを出力してください。
結果はユーザーが読みやすいように、適度に改行を入れてください。

ユーザー情報:
- 名前: ${initialUserData.name}
- 生年月日: ${initialUserData.dob}
- 性別: ${initialUserData.gender}

チャット会話履歴はこのメッセージの前にあります。それら全てを考慮してください。`;

        const response: GenerateContentResponse = await chat.sendMessage({ message: appraisalPrompt });
        const accumulatedResponse = response.text;


        if (loadingAppraisalMessageElement) {
            loadingAppraisalMessageElement.remove();
            loadingAppraisalMessageElement = null;
        }

        if (accumulatedResponse.trim() === "") {
            displayError("申し訳ありません、鑑定書の作成に失敗しました。もう一度お試しください。");
            if (createAppraisalButton) createAppraisalButton.disabled = false;
        } else {
            const now = new Date(); // For header date
            const reportHeaderDateString = `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}`;
            const reportTitleString = currentCharacter.appraisalTitleFormat
                        .replace('{name}', initialUserData.name || "お客様")
                        .replace('{method}', currentCharacter.divinationMethod);

            lastAppraisalData = {
                title: reportTitleString,
                content: accumulatedResponse, // This now includes date and method from AI
                date: reportHeaderDateString, // This is for the header only
                userName: initialUserData.name || "情報なし",
                userDob: initialUserData.dob ? initialUserData.dob.replace(/-/g, '年') + '日' : "情報なし",
                userGender: initialUserData.gender || "情報なし"
            };
            isAppraisalValidForCurrentChat = true;
            populateAndShowAppraisalModal(lastAppraisalData);
        }

    } catch (error) {
        console.error('Error creating appraisal:', error);
        if (loadingAppraisalMessageElement) {
            loadingAppraisalMessageElement.remove();
            loadingAppraisalMessageElement = null;
        }
        const errorMessageText = error instanceof Error ? error.message : '不明なエラーが発生しました。';
        let detailedError = errorMessageText;
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
             if (error.message.includes("got status")) {
                detailedError = error.message;
             }
        }
        displayError(`🤖 鑑定書の作成中にエラーが発生しました: ${detailedError}`);
        if (createAppraisalButton) createAppraisalButton.disabled = false;
    } finally {
        // Buttons are re-enabled when modal is closed or if consult again.
    }
}

function closeAppraisalReportAndShowOptions() {
    hideModal(appraisalReportModal);
    showPostAppraisalOptions();
}


function showPostAppraisalOptions() {
    if (postAppraisalOptionsContainer) {
        postAppraisalOptionsContainer.style.display = 'flex';
    }
    if (sendButton) sendButton.disabled = true;
    if (messageInput) messageInput.disabled = true;

    if (createAppraisalButton) {
        if (lastAppraisalData && isAppraisalValidForCurrentChat) {
            createAppraisalButton.style.display = 'inline-block';
            createAppraisalButton.disabled = false;
        } else {
            createAppraisalButton.style.display = 'none';
        }
    }
}

function hidePostAppraisalOptionsAndResumeChat() {
    if (postAppraisalOptionsContainer) {
        postAppraisalOptionsContainer.style.display = 'none';
    }
    if (sendButton) sendButton.disabled = false;
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.focus();
    }


    if (createAppraisalButton && createAppraisalButton.style.display === 'none' && lastAppraisalData && isAppraisalValidForCurrentChat) {
         createAppraisalButton.style.display = 'inline-block';
         createAppraisalButton.disabled = false;
    } else if (createAppraisalButton && createAppraisalButton.style.display === 'inline-block') {
        createAppraisalButton.disabled = false;
    }


    if (currentCollectionState !== 'chatting') {
        currentCollectionState = 'chatting';
    }
}

function resetToCharacterSelection() {
    // Use globally assigned elements if available, otherwise fetch them
    const charSelectionContainer = characterSelectionContainerGlobal || document.getElementById('character-selection-container');
    const chatAppCont = chatAppContainerGlobal || document.getElementById('chat-app-container');

    if (charSelectionContainer) charSelectionContainer.style.display = 'block';
    if (chatAppCont) chatAppCont.style.display = 'none';

    if (chatContainer) chatContainer.innerHTML = '';
    chat = null;
    currentCharacter = null;
    initialUserData = {};
    currentCollectionState = 'awaitingName';
    lastAppraisalData = null;
    isAppraisalValidForCurrentChat = false;

    if (messageInput) messageInput.value = '';
    if (sendButton) sendButton.disabled = true;
    if (messageInput) messageInput.disabled = true;
    if (createAppraisalButton) {
        createAppraisalButton.style.display = 'none';
        createAppraisalButton.disabled = true;
    }
    if (postAppraisalOptionsContainer) postAppraisalOptionsContainer.style.display = 'none';
    if (loadingAppraisalMessageElement) {
        loadingAppraisalMessageElement.remove();
        loadingAppraisalMessageElement = null;
    }
    hideModal(appraisalReportModal);
    if (characterSelectionError) {
        characterSelectionError.textContent = '';
        characterSelectionError.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Assign to global variables
    characterSelectionContainerGlobal = document.getElementById('character-selection-container');
    characterOptionButtons = document.querySelectorAll('.character-option');
    characterSelectionError = document.getElementById('character-selection-error');
    chatAppContainerGlobal = document.getElementById('chat-app-container');
    chatTitleElement = document.querySelector('.chat-title');
    chatContainer = document.getElementById('chat-container');
    messageInput = document.getElementById('message-input') as HTMLInputElement;
    sendButton = document.getElementById('send-button') as HTMLButtonElement;
    createAppraisalButton = document.getElementById('create-appraisal-button') as HTMLButtonElement;
    backArrowButton = document.querySelector('.back-arrow');
    postAppraisalOptionsContainer = document.getElementById('post-appraisal-options');
    consultAgainButton = document.getElementById('consult-again-button') as HTMLButtonElement;
    backToTopButton = document.getElementById('back-to-top-button') as HTMLButtonElement;
    appraisalReportModal = document.getElementById('appraisal-report-modal');
    reportTitleText = document.getElementById('report-title-text');
    reportDate = document.getElementById('report-date');
    reportUserName = document.getElementById('report-user-name');
    reportUserDob = document.getElementById('report-user-dob');
    reportUserGender = document.getElementById('report-user-gender');
    reportAiResponse = document.getElementById('report-ai-response');
    closeAppraisalReportButton = document.getElementById('close-appraisal-report-button') as HTMLButtonElement;
    reportCharacterImage = document.getElementById('report-character-image') as HTMLImageElement;


    if (!API_KEY) {
        displayError("APIキーが設定されていません。管理者に連絡してください。");
        if(characterOptionButtons) characterOptionButtons.forEach(b => b.disabled = true);
        if(sendButton) sendButton.disabled = true;
        if(createAppraisalButton) createAppraisalButton.disabled = true;
        if(messageInput) messageInput.disabled = true;
        return;
    }
    ai = new GoogleGenAI({ apiKey: API_KEY });

    if (characterOptionButtons) {
        characterOptionButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const selectedCharacterKey = button.dataset.character as CharacterKey;
                if (selectedCharacterKey && characterProfiles[selectedCharacterKey]) {
                    currentCharacter = characterProfiles[selectedCharacterKey];

                    const charSelectionContainer = document.getElementById('character-selection-container');
                    const chatAppCont = document.getElementById('chat-app-container');
                                        
                    if (charSelectionContainer) charSelectionContainer.style.display = 'none';
                    if (chatAppCont) chatAppCont.style.display = 'flex'; 
                    if (chatTitleElement && currentCharacter) chatTitleElement.textContent = currentCharacter.name;
                    
                    if (sendButton) sendButton.disabled = true;
                    if (messageInput) messageInput.disabled = true;

                    initialUserData = {};
                    currentCollectionState = 'awaitingName';
                    lastAppraisalData = null;
                    isAppraisalValidForCurrentChat = false;

                    const chatInitialized = await initializeChat(currentCharacter.systemInstruction);
                    if (chatInitialized) {
                        await startAIConversationFlow();
                    } else {
                        if (sendButton) sendButton.disabled = true;
                        if (messageInput) messageInput.disabled = true;
                        if (createAppraisalButton) createAppraisalButton.disabled = true;
                    }
                }
            });
        });
    }

    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }
    if (messageInput) {
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
            }
        });
    }

    if (createAppraisalButton) {
        createAppraisalButton.addEventListener('click', handleCreateAppraisalClick);
    }

    if (closeAppraisalReportButton) {
        closeAppraisalReportButton.addEventListener('click', closeAppraisalReportAndShowOptions);
    }

    if (consultAgainButton) {
        consultAgainButton.addEventListener('click', () => {
            hidePostAppraisalOptionsAndResumeChat();
        });
    }

    if (backToTopButton) {
        backToTopButton.addEventListener('click', () => {
            resetToCharacterSelection();
        });
    }

    if (backArrowButton) {
        backArrowButton.addEventListener('click', resetToCharacterSelection);
    }

    // Initial screen states
    if (characterSelectionContainerGlobal) characterSelectionContainerGlobal.style.display = 'block';
    if (chatAppContainerGlobal) chatAppContainerGlobal.style.display = 'none';
    if (appraisalReportModal) appraisalReportModal.style.display = 'none';
    if (postAppraisalOptionsContainer) postAppraisalOptionsContainer.style.display = 'none';

    if (messageInput) messageInput.disabled = true;
    if (sendButton) sendButton.disabled = true;
});
