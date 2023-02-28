//https://skyway.ntt.com/ja/docs/user-guide/javascript-sdk/quickstart/
import { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } from "@skyway-sdk/room";

// SkyWay Auth Token を作る
// SkyWay Auth Token とは、SkyWay を利用するための JWT 形式のトークンです。
// トークンごとに権限を細かく設定することでき、例えば room ごとの入室を特定ユーザーに制限する、といったことができます。
// ここでは細かい SkyWay Auth Token の設定方法に関する説明は省きます（SkyWay Auth Token についてはこちら）。
// 本チュートリアルでは、すぐに通信を試していただくために、トークン生成をフロントエンドで実装していますが、 本来はSkyWay Auth Token はサーバーアプリケーションで生成して client アプリケーションに対して渡すようにするべきです。 第三者に SkyWay Auth Token 生成に必要なシークレットキーを利用して任意の room に入ることができるような Token を作成される可能性があります。
// main.js に以下の内容を入力してください。先ほど取得したアプリケーション ID とシークレットキーを置換する必要があります。
const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  scope: {
    app: {
      id: "d4a53e9a-468c-492a-90ac-d2e9752c8e65",
      turn: true,
      actions: ["read"],
      channels: [
        {
          id: "*",
          name: "*",
          actions: ["write"],
          members: [
            {
              id: "*",
              name: "*",
              actions: ["write"],
              publication: {
                actions: ["write"],
              },
              subscription: {
                actions: ["write"],
              },
            },
          ],
          sfuBots: [
            {
              actions: ["write"],
              forwardings: [
                {
                  actions: ["write"],
                },
              ],
            },
          ],
        },
      ],
    },
  },
}).encode("r6NleMSWfqjQd/DlvtShU+G5BNYr18BjZbSGP/3gZ2E=");

// const playButton = document.getElementById("playButton");
// playButton.addEventListener("click", function () {
//   audio.play();
// });

(async () => {
  // 即時実行の async 関数で全体を囲みます。これにより、非同期処理を await で記述できるようになります。以降のJavaScript の処理はこの即時実行関数内に記述します。
  const localVideo = document.getElementById("local-video");
  const buttonArea = document.getElementById("button-area");
  const remoteMediaArea = document.getElementById("remote-media-area");
  const roomNameInput = document.getElementById("room-name");
  const dataStreamInput = document.getElementById("data-stream");

  const myId = document.getElementById("my-id");
  const joinButton = document.getElementById("join");
  const writeButton = document.getElementById("write");

  // マイク音声とカメラ映像を取得し、それぞれを変数に分割代入します。
  // const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  // // video 要素に映像（video）をセットします（audio は後ほど利用します）
  // video.attach(localVideo);
  // // セットした映像を再生します
  // await localVideo.play();

  ///////////////////canvas
  // Canvasの要素
  const canvas = document.getElementById("canvas");
  // 2Dコンテキスト
  const context = canvas.getContext("2d");
  // クリアボタンの要素
  const clearButton = document.getElementById("clearButton");
  // 現在のマウスの位置
  let currentX, currentY;
  // 直前のマウスの位置
  let previousX, previousY;
  // 現在のマウスの位置
  let opp_currentX, opp_currentY;
  // 直前のマウスの位置
  let opp_previousX, opp_previousY;

  //イラスト位置
  let previous_illust_x = 0;
  let previous_illust_y = 0;
  //マウス押し込み状態
  let DRAW_LINE_STATE = "ready";
  //オーディオ設定
  const audio = document.getElementById("myAudio");
  //
  // マウスが動いたときの処理を登録
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mouseup", onMouseUp);

  //データ送信
  function sendData(report_type, pos_data) {
    console.log("send" + report_type);
    data.write([report_type, pos_data]);
  }

  // マウスが動いたときの処理
  function onMouseMove(event) {
    // 現在のマウスの位置を更新
    currentX = event.clientX - canvas.offsetLeft;
    currentY = event.clientY - canvas.offsetTop;
    console.log(DRAW_LINE_STATE);
    // ellipse(currentX, currentY, 10, 10);
    if (DRAW_LINE_STATE == "run") {
      drawLine(previousX, previousY, currentX, currentY);
      sendData("draw", [previousX, previousY, currentX, currentY]);
      // 直前のマウスの位置を更新
      previousX = currentX;
      previousY = currentY;

      // データを送信
      // sendData({ x: currentX, y: currentY });
      console.log(currentX);

      // data.write([currentX, currentY]);
    }
  }

  function drawLine(X0, Y0, X1, Y1) {
    // ペンを描画
    context.beginPath();
    context.moveTo(X0, Y0);
    context.lineTo(X1, Y1);
    context.stroke();
  }

  // マウスがクリックされたときの処理
  function onMouseDown(event) {
    console.log("DOWN");
    // 現在のマウスの位置を更新
    currentX = event.clientX - canvas.offsetLeft;
    currentY = event.clientY - canvas.offsetTop;

    // 直前のマウスの位置を更新
    previousX = currentX;
    previousY = currentY;

    //描画状態更新
    DRAW_LINE_STATE = "run";

    // マウスが動いたときの処理を登録
    // canvas.addEventListener("mousemove", onMouseMove);
  }

  // マウスが離されたときの処理
  function onMouseUp(event) {
    //描画状態更新
    console.log("UP");
    DRAW_LINE_STATE = "ready";
    // マウスが動いたときの処理を解除
    // canvas.removeEventListener("mousemove", onMouseMove);
  }

  //////////DragImage//////////
  const illustration = document.querySelector(".illustration");
  let offsetX, offsetY;

  // ドラッグの開始時に実行される関数
  function dragStart(event) {
    console.log("dragstart");
    // // ドラッグされた要素の位置を取得
    illustration_x = event.clientX - illustration.clientWidth / 2;
    illustration_y = event.clientY - illustration.clientHeight / 2;
    moveIllustration(illustration_x, illustration_y);
    sendData("drag", [illustration_x, illustration_y]);

    SoundControl("play");
    sendData("sound", "play");
  }

  // ドラッグ中に実行される関数
  function drag(event) {
    // ドラッグされた要素を移動
    if (event.clientX == 0) {
      return;
    }
    illustration_x = event.clientX - illustration.clientWidth / 2;
    illustration_y = event.clientY - illustration.clientHeight / 2;
    moveIllustration(illustration_x, illustration_y, previous_illust_x, previous_illust_y);
    sendData("drag", [illustration_x, illustration_y, previous_illust_x, previous_illust_y]);
    previous_illust_x = illustration_x;
    previous_illust_y = illustration_y;
  }

  // ドラッグが終了したときに実行される関数
  function dragEnd(event) {
    SoundControl("pause");
    sendData("sound", "pause");
  }

  function moveIllustration(x, y, previous_x, previous_y) {
    illustration.style.left = x + "px";
    illustration.style.top = y + "px";
    console.log(previous_x);
    console.log(previous_x - x);
    if (previous_x - x < 0) {
      // illustration.style.transform = "scaleX(-1)";
    }
  }
  //サウンドコントロール
  function SoundControl(command) {
    if (command == "play") {
      console.log("play");
      // let soundAdress = "./sound/0000_s082_CarKlaxion.mp3";
      // let soundTest = new Audio(absolutePath);
      // soundTest.play(); // 再生
      audio.play();
      // sendData("sound", "play");
    } else if (command == "pause") {
      // soundTest.pause(); //停止
      // sendData("sound", "pause");
    }
  }

  // ドラッグイベントのリスナーを登録
  illustration.addEventListener("dragstart", dragStart);
  illustration.addEventListener("drag", drag);
  illustration.addEventListener("dragend", dragEnd);
  //////////////////////

  ///////////////////canvas////////////////

  const data = await SkyWayStreamFactory.createDataStream();
  writeButton.onclick = () => {
    data.write(dataStreamInput.value);
    console.log(data);
    dataStreamInput.value = "";
  };

  // join ボタンを押した際に実行されるイベントハンドラを作成し、この中に以降の処理を記載していきます。
  joinButton.onclick = async () => {
    //     先ほど生成した SkyWay Auth Token を用いて、context を作ります。
    // context とは、グローバルな情報を管理するオブジェクトです。認証・認可や、ログの設定などの情報を管理します。
    // また、このとき、roomNameInput が空の場合には、以降の処理が実行できないため、空かどうかのチェックを入れています。
    if (roomNameInput.value === "") return;

    const context = await SkyWayContext.Create(token);
    //     次に SkyWayRoom.FindOrCreate という関数の第一引数に、先ほど作成した context を渡して、room を作成します。
    // この関数は、もしすでに同じ name の room が存在しなければ作成し、存在する場合にはその room を取得するという関数です。
    // 第2引数のオブジェクトで、type には”p2p”を指定します（なお、”sfu”を指定すると SFU ルームを作成可能です）。name には、ユーザーが input 要素に入力した値を用います。
    const room = await SkyWayRoom.FindOrCreate(context, {
      type: "p2p",
      name: roomNameInput.value,
    });
    //     次に、先ほど作成（or 取得）した room に入室します。 すると Member オブジェクトが返ってきます。ここでは me という変数名とします。
    // 自分の ID を表示するために、me.id を span 要素に格納します。
    const me = await room.join();

    myId.textContent = me.id;
    // Member オブジェクトの publish 関数の引数に、先ほど取得した audio と video を渡して、音声・映像を publish します。
    // await me.publish(audio);
    // await me.publish(video);
    await me.publish(data);
    //     相手の映像と音声を subscribe する
    // 相手の映像と音声を subscribe し、audio, video 要素にセットする処理を追加します。
    //     room の publications プロパティに、room に存在する publication の配列が入っています。この配列の各要素を、subscribeAndAttach 関数の引数に与えています。この関数については後ほど説明します。
    // room の onStreamPublished は Event 型のプロパティです。Event には、add という関数があります。この関数の引数にコールバック関数を渡すと、その room 内で誰かが publish された時点でコールバック関数が実行されます。コールバック関数の引数に入っているオブジェクトの publication プロパティに、publish された publication が存在していますので、これを subscribeAndAttach 関数に渡します。
    const subscribeAndAttach = (publication) => {
      // subscribeAndAttach 関数を作成します。引数に publication を取ります。この publication が自分（me）が publish したものでない場合に、以降の処理を実行します。
      if (publication.publisher.id === me.id) return;
      // 1. publisher.id と publication の contentType（video or audio）をラベルにしたボタンを、ボタンエリアに追加します。
      const subscribeButton = document.createElement("button");
      subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
      buttonArea.appendChild(subscribeButton);

      // 3-2. 3-1 で作成したボタンのイベントハンドラを作成します。
      subscribeButton.onclick = async () => {
        // 3-2-1. publication を subscribe します。すると stream が返却されます。
        const { stream } = await me.subscribe(publication.id);
        console.log(stream.contentType);

        switch (stream.contentType) {
          case "video":
            {
              const elm = document.createElement("video");
              elm.playsInline = true;
              elm.autoplay = true;
              stream.attach(elm);
              remoteMediaArea.appendChild(elm);
            }
            break;
          case "audio":
            {
              const elm = document.createElement("audio");
              elm.controls = true;
              elm.autoplay = true;
              stream.attach(elm);
              remoteMediaArea.appendChild(elm);
            }
            break;
          case "data": {
            const elm = document.createElement("div");
            remoteMediaArea.appendChild(elm);
            // elm.innerText = "data\n";
            stream.onData.add((data) => {
              elm.innerText += data + "\n";
              [opp_report_type, opp_data] = data;
              if (opp_report_type == "draw") {
                drawLine(opp_data[0], opp_data[1], opp_data[2], opp_data[3]);
              } else if (opp_report_type == "drag") {
                moveIllustration(opp_data[0], opp_data[1], opp_data[2], opp_data[3]);
              } else if (opp_report_type == "sound") {
                console.log("recieve_sound");
                SoundControl(opp_data);
              }
              // [opp_currentX, opp_currentY] = data;
              // console.log(opp_currentX);
              // console.log(opp_currentY);
              // drawLine(opp_previousX, opp_previousY, opp_currentX, opp_currentY);
              // // 直前のマウスの位置を更新
              // opp_previousX = opp_currentX;
              // opp_previousY = opp_currentY;
            });
          }
        }
      };
    };

    room.publications.forEach(subscribeAndAttach);
    room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
  };
})();
