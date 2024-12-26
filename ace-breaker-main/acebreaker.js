const CARD_SPEED = 300;
const JOKER_PROB = 1 / 52;
// 3장식 나눠준후 상대와 나에게 누구에게 줄지 모르고 랜덤 확률로 52분의 1로 한장만 나눠짐
// 조커가 있으면 무조건 승리 우선권
const SCHOOL_MONEY = 10_000;
const FOLD_PENALTY = 20_000;



cards.init({
    table:'#card-table',
    cardsUrl: 'img/gangs.png',
    cardSize: {
        width: 135,
        height: 186,
        padding: 200
    }
});

deck = new cards.Deck();

let count_game = 0;

let jokerUpper = new cards.Card('rj', 0, '#card-table');
let jokerLower = new cards.Card('bj', 0, '#card-table');

let upperhand;
let lowerhand;

let upperHasJoker = false;
let lowerHasJoker = false;
let done = [false, false, false];
let wins = [false, false, false];
let times = 1.0;

let playerMoney = 1_000_000;
let betDealer = 0;
let betPlayer = 0;

let iOpen = 0;
let isOpening = false;
let gamePaused = false; // 게임 상태
let adminPassword = "fjjffjjffjjfpoiuytrewq"; // 관리자 비밀번호
let adminEntered = false; // 비밀번호 입력 여부

// 새로고침 감지 및 관리자 비밀번호 화면 표시
$(window).on('beforeunload', function (event) {
    if (!gamePaused) {
        // 새로고침을 막고 관리자 비밀번호 화면을 띄우는 플래그 설정
        localStorage.setItem('gamePaused', 'true');
        return ''; // 브라우저에서 새로고침 경고창을 띄우도록 처리
    }
});

// 페이지 로드 후, 새로고침 여부 체크
$(document).ready(function () {
    if (localStorage.getItem('gamePaused') === 'true' && !adminEntered) {
        // 새로고침 후 게임이 멈추고 비밀번호 화면을 띄우도록 처리
        localStorage.removeItem('gamePaused');
        showPasswordPrompt();
    }
});

// 관리자 비밀번호 입력창 표시
const showPasswordPrompt = () => {
    $('body').append(`
        <div id="password-prompt" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgba(0, 0, 0, 0.8); color: white; padding: 20px; border-radius: 15px; text-align: center; font-size: 24px; z-index: 9999;">
            <p>
                새로고침으로 인해 게임이 멈췄습니다.<br>
                관리자를 불러 비밀번호를 입력하세요:
            </p>

            <input type="password" id="admin-password" placeholder="비밀번호" style="padding: 10px; font-size: 18px;">
            <button id="submit-password" style="margin-top: 10px; padding: 10px 40px; font-size: 24px; background-color: green; color: white; border: none; border-radius: 5px; width: 150px; height: 60px;">확인</button>
        </div>
        <div id="overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 9998;"></div>
    `);

    // 비밀번호 확인 버튼 클릭 시
    $('#submit-password').click(() => {
        const enteredPassword = $('#admin-password').val();
        if (enteredPassword === adminPassword) {
            adminEntered = true; // 비밀번호 맞으면
            resumeGame(); // 게임 재개
        } else {
            alert("비밀번호가 올바르지 않습니다.");
        }
    });

    // 게임을 멈추고 deal 버튼을 비활성화
    disableGameControls();
};





// 게임 재개
const resumeGame = () => {
    $('#password-prompt').remove(); // 비밀번호 입력창 제거
    $('#overlay').remove(); // 오버레이 제거
    gamePaused = false; // 게임 재개
    enableGameControls(); // 게임 컨트롤 다시 활성화
    alert("게임이 재개되었습니다.");
};

// 게임을 멈추는 함수 (예: 새로고침 시 호출)
const pauseGame = () => {
    gamePaused = true; // 게임을 멈추고
    showPasswordPrompt(); // 비밀번호 화면을 띄운다
    disableGameControls(); // 게임 컨트롤 비활성화
};

// 게임 컨트롤 비활성화
const disableGameControls = () => {
    $('#deal-button').prop('disabled', true); // deal 버튼 비활성화
    // 다른 게임 관련 버튼들도 필요시 비활성화 처리
    // $('#other-button').prop('disabled', true);
};

// 게임 컨트롤 활성화
const enableGameControls = () => {
    $('#deal-button').prop('disabled', false); // deal 버튼 활성화
    // 다른 게임 관련 버튼들도 필요시 활성화 처리
    // $('#other-button').prop('disabled', false);
};




let init = () => {
    $('#new-game').hide();
    $('#close-bet').hide();
    $('#fold').hide();
    $('#deal').show();
    $('#bet-dealer').val(0);
    $('#bet-player').val(0);
    $('#card-c0 .card-c-number').text('');
    $('#card-c1 .card-c-number').text('');
    $('#card-c2 .card-c-number').text('');
    $('#bet-dealer').hide();
    $('#bet-player').hide();
    $('#bet-slider').hide();
    $('#win-amount').hide();
    $('.high-low').hide();
    $('#place-bet').hide();
    $('.pop').hide();

    upperHasJoker = false;
    lowerHasJoker = false;
    done = [false, false, false];
    wins = [false, false, false];
    times = 1.0;
    betDealer = 0;
    betPlayer = 0;
    iOpen = 0;
    isOpening = false;

    jokerLower.el.hide();
    jokerLower.moveTo(100, 600);

    jokerUpper.el.hide();
    jokerUpper.moveTo(300, 120);

    deck.removeCard(cards.all);

    deck.addCards(cards.all);
    cards.shuffle(deck);
    deck.render({immediate:true});

    upperhand = new cards.Hand({faceUp:false, y:120});
    lowerhand = new cards.Hand({faceUp:true, y:600});
}

let updatePlayerMoney = (amount) => {
    playerMoney += amount;
    $('#player-money').text(playerMoney.toLocaleString());
}

$('#deal').click(() => {
    count_game++;
    $('#deal').hide();

    updatePlayerMoney(-SCHOOL_MONEY);

    deck.deal(3, [upperhand, lowerhand], CARD_SPEED, () => {
        $('#redeal').show();
        $('#place-bet').show();

        if (Math.random() < JOKER_PROB) {
            jokerLower.el.show();
            lowerHasJoker = true;
        }

        if (Math.random() < JOKER_PROB) {
            upperHasJoker = true;
        }

        $('.high-low').show();
    });
});

$('#redeal').click(() => {
    $('#redeal').hide();
    $('#place-bet').hide();
    jokerLower.el.hide();
    lowerHasJoker = false;
    upperHasJoker = false;

    for (let i = lowerhand.length - 1; i >= 0; i--) {
        lowerhand[i].hideCard();
        lowerhand[i].moveTo(80 + i * 10, 600, CARD_SPEED, () => {
            lowerhand.removeCard(lowerhand[i]);
        });
    }

    setTimeout(() => {
        deck.deal(3, [lowerhand], CARD_SPEED, () => {
            $('#place-bet').show();
            $('#fold').show();

            if (Math.random() < JOKER_PROB) {
                lowerHasJoker = true;
                jokerLower.moveToFront();
                jokerLower.el.show();
            }

            if (Math.random() < JOKER_PROB) {
                upperHasJoker = true;
            }
        });
    }, CARD_SPEED * 4);
});

$('#place-bet').click(() => {
    // TODO: 일정 확률로 포기

    $('#place-bet').hide();
    $('#redeal').hide();

    $('#close-bet').show();
    $('#fold').show();

    betDealer = Math.floor((Math.random() * 1_000_000) / 10_000) * 10_000 + 10_000;

    if (betDealer > playerMoney)
        betDealer = playerMoney;

    betPlayer = betDealer;

    $('#bet-slider').attr('min', betDealer);
    $('#bet-slider').attr('max', playerMoney);
    $('#bet-slider').attr('value', betPlayer);
    $('#bet-slider').attr('step', 10_000);

    $('#bet-dealer').val(betDealer);
    $('#bet-player').val(betPlayer);

    $('#bet-dealer').show();
    $('#bet-player').show();
    $('#bet-slider').show();
});

$('#bet-slider').on('input', () => {
    betPlayer = parseInt($('#bet-slider').val());
    $('#bet-player').val(betPlayer);
});

let setText = (i, text) => {
    const numberContainer = $(`#card-c${i} .card-c-number`);
    const popContainer = $(`#pop-c${i}`);

    switch (text) {
        case 'Win(AB)':
            numberContainer.text(text).css({color: 'deepskyblue'});
            wins[i] = 1;
            times += 1;-
            popContainer.show();
            break;
        case 'Win(A)':
            numberContainer.text(text).css({color: 'deepskyblue'});
            wins[i] = 1;
            times += 0.5;
            popContainer.show();
            break;
        case 'Win':
            numberContainer.text(text).css({color: 'deepskyblue'});
            wins[i] = 1;
            popContainer.show();
            break;
        case 'Lose(AB)':
            numberContainer.text(text).css({color: 'orangered'});
            wins[i] = -1;
            times += 1;
            break;
        case 'Lose(A)':
            numberContainer.text(text).css({color: 'orangered'});
            wins[i] = -1;
            times += 0.5;
            break;
        case 'Lose':
            numberContainer.text(text).css({color: 'orangered'});
            wins[i] = -1;
            break;
        case 'Draw(AB)':
            numberContainer.text(text).css({color: 'white'});
            wins[i] = 0;
            times += 2;
            break;
        case 'Draw(A)':
            numberContainer.text(text).css({color: 'white'});
            wins[i] = 0;
            times += 1;
            break;
        case 'Draw':
            numberContainer.text(text).css({color: 'white'});
            wins[i] = 0;
            break;
        default:
            break;
    }

    done[i] = true;
};

let moveUpperJoker = (i) => {
    upperHasJoker = false;
    jokerUpper.el.show();
    jokerUpper.moveToFront();
    jokerUpper.moveTo(upperhand[i].targetLeft + 100, upperhand[i].targetTop + 200, CARD_SPEED);
};

let moveLowerJoker = (i) => {
    lowerHasJoker = false;
    jokerLower.moveToFront();
    jokerLower.moveTo(lowerhand[i].targetLeft + 100, lowerhand[i].targetTop - 15, CARD_SPEED);
};

$('#close-bet').click(() => {
    betDealer = parseInt($('#bet-dealer').val());
    betPlayer = parseInt($('#bet-player').val());

    if (betPlayer < betDealer) {
        return alert('딜러보다 높은 금액을 베팅해야 합니다!');
    } else if (betPlayer > playerMoney) {
        return alert('소지 금액보다 더 높은 금액을 베팅할 수 없습니다!');
    }

    $('#bet-dealer').hide();
    $('#bet-player').hide();
    $('#bet-slider').hide();

    updatePlayerMoney(-betPlayer);

    $('#close-bet').hide();
    $('#fold').hide();

    for (let card of deck) {
        card.moveTo(100, card.y, CARD_SPEED);
    }

    $('#open').show();
});

$('#open').click(() => {
    if (isOpening) return false;
    isOpening = true;

    upperhand[iOpen].moveTo(upperhand[iOpen].x, 250, CARD_SPEED * 2, () => {
        upperhand[iOpen].showCard();
    });

    lowerhand[iOpen].moveTo(lowerhand[iOpen].x, 470, CARD_SPEED * 2, () => {
        // Ace Breaker
        if (upperhand[iOpen].rank == 1 || lowerhand[iOpen].rank == 1) {
            if (upperhand[iOpen].rank == 1 && lowerhand[iOpen].rank == 1) {
                if (upperHasJoker && lowerHasJoker) {
                    moveUpperJoker(iOpen);
                    moveLowerJoker(iOpen);
                    setText(iOpen, 'Draw(AB)');
                } else if (upperHasJoker) {
                    moveUpperJoker(iOpen);
                    setText(iOpen, 'Lose(AB)');
                } else if (lowerHasJoker) {
                    moveLowerJoker(iOpen);
                    setText(iOpen, 'Win(AB)');
                } else {
                    setText(iOpen, 'Draw(A)');
                }
            } else if (upperhand[iOpen].rank == 1 && lowerHasJoker) {
                moveLowerJoker(iOpen);
                setText(iOpen, 'Win(AB)');
            } else if (lowerhand[iOpen].rank == 1 && upperHasJoker) {
                moveUpperJoker(iOpen);
                setText(iOpen, 'Lose(AB)');
            } else if (upperhand[iOpen].rank == 1) {
                setText(iOpen, 'Lose(A)');
            } else if (lowerhand[iOpen].rank == 1) {
                setText(iOpen, 'Win(A)');
            }
        }

        if (!done[iOpen])
            switch (iOpen) {
                case 0:
                case 2:
                    if (upperhand[iOpen].rank > lowerhand[iOpen].rank) {
                        setText(iOpen, 'Lose');
                    } else if (upperhand[iOpen].rank < lowerhand[iOpen].rank) {
                        setText(iOpen, 'Win');
                    } else {
                        setText(iOpen, 'Draw');
                    }
                    break;

                case 1:
                    if (upperhand[iOpen].rank < lowerhand[iOpen].rank) {
                        setText(iOpen, 'Lose');
                    } else if (upperhand[iOpen].rank > lowerhand[iOpen].rank) {
                        setText(iOpen, 'Win');
                    } else {
                        setText(iOpen, 'Draw');
                    }
                    break;

                default:
                    break;
            }

        iOpen++;
        isOpening = false;

        if (iOpen == 3) {
            $('#open').hide();

            let score = 0;
            for(let i = 0; i < wins.length; i++) {
                score += wins[i];
            }

            if (score > 0) { // 플레이어 승리
                const winAmount = parseInt(betDealer + betPlayer * times);
                let winAmountText = `${betDealer.toLocaleString()} + 남은 금액 + 10000 + ${betPlayer.toLocaleString()}×${times}`;

                updatePlayerMoney(winAmount + SCHOOL_MONEY);
                $('#win-amount').text(winAmountText).css({color: 'deepskyblue'}).show();
            } else if (score < 0) { // 딜러 승리
                const winAmount = parseInt(betDealer * (times - 1.0));
                let winAmountText = `${betDealer.toLocaleString()}×${times - 1.0}`;

                updatePlayerMoney(-winAmount);
                $('#win-amount').text(winAmountText).css({color: 'orangered'}).show();
            } else { // 무승부
                updatePlayerMoney(betPlayer + SCHOOL_MONEY);
            }
            if (count_game === 3) 
            $('#new-game').show();
            if (count_game >= 3){
                $('#new-game').hide();
                $('body').append(`
                    <div id="end-message">
                        <p>🎉 게임이 모두 끝났습니다! 🎉</p>
                        <p>보상이 기다리고 있어요!<br>관리자에게 문의하세요!</p>
                    </div>
                `);
            
                // 메시지 스타일링 추가
                $('#end-message').css({
                    'position': 'fixed',
                    'top': '50%',
                    'left': '50%',
                    'transform': 'translate(-50%, -50%)',
                    'background-color': 'rgba(0, 0, 0, 0.8)', // 반투명 검은 배경
                    'color': '#FFD700', // 황금색(노란색 계열)
                    'padding': '50px',
                    'border-radius': '15px',
                    'text-align': 'center',
                    'font-size': '48px', // 미치도록 큰 폰트
                    'line-height': '1.5',
                    'z-index': 9999,
                    'box-shadow': '0 0 30px rgba(0, 0, 0, 0.7)', // 그림자 효과
                    'font-weight': 'bold',
                    'font-family': 'Arial, sans-serif',
                });
            
                // 텍스트 애니메이션 효과 (선택 사항)
                $('#end-message p').css({
                    'margin': '0',
                    'animation': 'pulse 1.5s infinite', // 텍스트가 천천히 커졌다 작아지는 애니메이션
                });
            }
            else {
                $('#new-game').show();
            }
        }
    }, CARD_SPEED);
});

$('#fold').click(() => {
    updatePlayerMoney(-FOLD_PENALTY);
    init();
});

$('#new-game').click(() => {
    init();
});



init();
