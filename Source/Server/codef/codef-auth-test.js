const {Router} = require('express');
const router = Router();
const KEY = require('./codef-key');
const mysql = require('mysql');

const mysqlConnection = mysql.createConnection({
  host: 'go5home.iptime.org', // rds엔트포인트(aws RDS)
  user: 'capstone',
  password: 'dK4!X!Y(Q6',
  database: 'TTINGCARD_DB'
});

mysqlConnection.connect();

const {
    EasyCodef,
    EasyCodefConstant,
    EasyCodefUtil,
  } = require('easycodef-node');

// auth 2.0 인증
var crypto = require("crypto");
var constants = require("constants");
var https = require("https");
var parse = require("url-parse");
var urlencode = require("urlencode");

var connected_body;


//------------------------------------------------------------------------------------------------//
// 계정 등록
//------------------------------------------------------------------------------------------------//
var codef_account_create_url = 'https://development.codef.io/v1/account/create'
const PUBLIC_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsPUBYBaCoHfnZA0vjfbArkiHts8SBVx1NCiSRmwVuKV341Oj80Csyx0mUdnv3agIRPG3puYMi2wbe+ZCAjXA7rttKN1rldidAcbqdth+tuL9WAVr4wPJ3eCJVkulghN7Gx5Y0bQr1YB3s/2rY87R17D/uFI0hjfF5ZmUtSFbLk2jh+MY1ToM+vQfrwlQNfTpNljjR6Hkd1lRKuDjth1z/KsEwP75baASRV+Pj4RePJE8u2Pqt4vYrLHMhnbOwVtuNSirG82sgJjgrq8QB2Jl71yYzwpg1UABOs7CrNbvtNm9xTswzTIXf7mQpPncryvk7To3d7QniWwUqLuiC4SzwQIDAQAB';
// TODO: 비밀번호 앱에서 가져오는 테스트 중. 나중에 주석 풀기.
var RSA_password = publicEncRSA(PUBLIC_KEY, "djWjfkrh1324%");

var codef_account_create_body = {
            'accountList':[                  // 계정목록
              {
                  "countryCode": "KR",        // (필수)국가코드
                  "businessType": "CD",       // (필수)업무구분 -> 은행,저축은행 : BK / 카드 : CD / 증권 : ST / 보험 : IS
                  "clientType": "P",          // (필수)고객구분 -> 개인 : P / 기업, 법인 : B / 통합 : A
                  "organization": "0305",     // (필수)기관코드
                  "loginType": "1",           // (필수)로그인방식 -> 인증서 : 0 / 아이디, 패스워드 : 1
                  "id": "askhs0302",          // (옵션)아이디방식 -> 아이디 방식일 경우 필수/ (키움)복수 계정 보유 고객의 경우 사용
                  "password": RSA_password,   // (필수)인증서 방식일 경우 인증서 패스워드 / 아이디 방식일 경우 아이디 패스우드 입력
                  "birthDate": "980302",      // (옵션)생년월일
                  //"loginTypeLevel":"",        // (옵션)신한/롯데 법인카드의 경우 [로그인구분] 이용자 : 0 / 사업장/부서관리자 : 1 / 총괄관리자 : 2. (default : 2)
                  //"clientTypeLevel":"",       // (옵션)신한 법인카드의 경우 [회원구분] 신용카드 회원 : 0 / 체크카드 회원 : 1 / 연구비 신용카드 회원 : 2
                  //"cardNo":"",                // (옵션)KB카드 소지확인 인증이 필요한 경우 필수 : 마스킹 없는 전체 카드번호 입력
                  //"cardPassword":"",          // (옵션)KB카드 소지확인 필요한 경우 : 카드 비밀번호 앞 2자리
              }
            ]
};

function publicEncRSA(publicKey, data) {
  var pubkeyStr = "-----BEGIN PUBLIC KEY-----\n" + publicKey + "\n-----END PUBLIC KEY-----";
  var bufferToEncrypt = new Buffer(data);
  var encryptedData = crypto.publicEncrypt({"key" : pubkeyStr, padding : constants.RSA_PKCS1_PADDING},bufferToEncrypt).toString("base64");

  console.log(encryptedData); 

  return encryptedData;
};

//------------------------------------------------------------------------------------------------//
// AUTH 2.0 인증
//------------------------------------------------------------------------------------------------//
const DEMO_CLIENT_ID = '46a1384a-b3f5-4562-884b-42e131d00417';
const DEMO_CLIENT_SECRET = '25e56a19-87e0-4f18-a67b-a743ef0b3788';


var https = require("https");
var parse = require("url-parse");
var urlencode = require("urlencode");

//------------------------------------------------------------------------------------------------//
// httpSender -> HTTP 기본 함수
//------------------------------------------------------------------------------------------------//
var httpSender = function(url, token, body) {
  console.log("========== httpSender ========== ");
  var uri = parse(url, true);

  var request = https.request(
    {
      hostname: uri.hostname,
      path: uri.pathname,
      port: uri.port,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      }
    },
    codefApiCallback
  );
  request.write(urlencode.encode(JSON.stringify(body)));
  request.end();
};
//------------------------------------------------------------------------------------------------//
// httpSender -> HTTP 기본 callback 함수
//------------------------------------------------------------------------------------------------//
// CODEF API Callback
var codefApiCallback = function(response) {
  console.log("codefApiCallback Status: " + response.statusCode);
  console.log("codefApiCallback Headers: " + JSON.stringify(response.headers));

  var body = "";
  response.setEncoding("utf8");
  response.on("data", function(data) {
    body += data;
  });

  // end 이벤트가 감지되면 데이터 수신을 종료하고 내용을 출력한다
  response.on("end", function() {
    console.log("codefApiCallback body:" + urlencode.decode(body));

    // 데이저 수신 완료
    if (response.statusCode == 200) {
      console.log("정상처리");
      httpSenderCreateConnectedId(codef_account_create_url, token, connected_body);
    } else if (response.statusCode == 401) {
      requestToken(
        token_url,
        DEMO_CLIENT_ID,
        DEMO_CLIENT_SECRET,
      );
    } else {
      console.log("API 요청 오류");
    }
    // callback(response);
    
  });
};

//------------------------------------------------------------------------------------------------//
// httpSenderCreateConnectedId
//------------------------------------------------------------------------------------------------//
var httpSenderCreateConnectedId = function(url, token, body) {
  console.log("========== httpSender ========== ");
  var uri = parse(url, true);

  var request = https.request(
    {
      hostname: uri.hostname,
      path: uri.pathname,
      port: uri.port,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      }
    },
    connectectedidCallback
  );
  request.write(urlencode.encode(JSON.stringify(body)));
  request.end();
};

//------------------------------------------------------------------------------------------------//
// connectectedidCallback
//------------------------------------------------------------------------------------------------//
var connectectedidCallback = function(response) {
  console.log("codefApiCallback Status: " + response.statusCode);
  console.log("codefApiCallback Headers: " + JSON.stringify(response.headers));

  var body = "";
  response.setEncoding("utf8");
  response.on("data", function(data) {
    body += data;
  });

  // When the end event is detected, data reception ends and the contents are output
  response.on("end", function() {
    console.log("connectectedidCallback body: " + urlencode.decode(body));
    var responseBody = JSON.parse(urlencode.decode(body)); // Parse the body as JSON

    // Data reception complete
    if (response.statusCode === 200) {
      console.log("Connected ID Issued");
      console.log("Connected ID: " + responseBody.data.connectedId);

    } else if (response.statusCode === 401) {
      console.log("Failed");
    } else {
      console.log("API request error");
    }
  });
};

var getConnectedId = function(){
  var sql =  'select connected_id FROM tbl_사용자 WHERE id = 15';
  var params = [email];
  mysqlConnection.query(sql, params, function(error, result, fields)
  {
    if(error)
    {
        res.status(400).json('error ocurred');         
        console.log('들어옴1');  
    }
    else
    {
      if(result.length > 0 )
      {
        if(result[0].email == params[0])
        {
            return true;
        }
        else
        {
          return false;
        }
      }
    }
  });
}

var InsertConnectedId = function(connectedId){
  var sql =  'SELECT * FROM tbl_사용자 WHERE email = ?';
  var params = [email];
  mysqlConnection.query(sql, params, function(error, result, fields)
  {
    if(error)
    {
        res.status(400).json('error ocurred');         
        console.log('들어옴1');  
    }
    else
    {
      if(result.length > 0 )
      {
          if(result[0].email == params[0])
          {
              res.status(200).json(result);
              console.log('로그인 성공');  
          }
          else
          {
              res.status(204).json('Email does not match');   
              console.log('로그인 실패: 이메일이 일치하지 않음');  
          }
      }
      else
      {
          var insertSql = 'INSERT INTO tbl_사용자 (email, name) VALUES (?, ?)';
          var insertParams = [email, name];
          console.log(email, name);
          mysqlConnection.query(insertSql, insertParams, function(error, result, fields) 
          {
              if (error) {
                  res.status(400).json('error ocurred');  
                  console.log('들어옴2');
              } else {
                  res.status(200).json(result);
                  console.log('회원가입 성공');  
              }
          });
      }
    }
  });
}

//------------------------------------------------------------------------------------------------//
// requestToken -> Token 재발급
//------------------------------------------------------------------------------------------------//
var requestToken = function(url, client_id, client_secret) {
  console.log("========== requestToken ========== ");
  var uri = parse(url);

  var authHeader = new Buffer(client_id + ":" + client_secret).toString(
    "base64"
  );

  var request = https.request(
    {
      hostname: uri.hostname,
      path: uri.pathname,
      port: uri.port,
      method: "POST",
      headers: {
        Acceppt: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + authHeader
      }
    },
    authTokenCallback
  );
  request.write("grant_type=client_credentials&scope=read");
  request.end();
};


var codef_url = "https://development.codef.io";
var token_url = "https://oauth.codef.io/oauth/token";

// 은행 개인 보유계좌
var account_list_path = "/v1/kr/bank/p/account/account-list";

// 기 발급된 토큰
var token = "";

// BodyData
var codef_api_body = {
  connectedId: "duGb-y7GASz8qN70KBZ1rE", // 엔드유저의 은행/카드사 계정 등록 후 발급받은 커넥티드아이디 예시
  organization: "0305"
};

//------------------------------------------------------------------------------------------------//
// authTokenCallback -> Token 재발급 Callback 함수
//------------------------------------------------------------------------------------------------//
var authTokenCallback = function(response) {
  console.log("authTokenCallback Status: " + response.statusCode);
  console.log("authTokenCallback Headers: " + JSON.stringify(response.headers));

  var body = "";
  response.setEncoding("utf8");
  response.on("data", function(data) {
    body += data;
  });

  // end 이벤트가 감지되면 데이터 수신을 종료하고 내용을 출력한다
  response.on("end", function() 
  {
    // 데이저 수신 완료
    console.log("authTokenCallback body = " + body);
    token = JSON.parse(body).access_token;
    if (response.statusCode == 200) 
    {
      console.log("토큰발급 성공");
      console.log("token = " + token);

      // CODEF API 요청
      // Create ConnectedId
      // if(getConnectedId == false)
      httpSenderCreateConnectedId(codef_account_create_url, token, connected_body);
    } 
    else 
    {
      console.log("토큰발급 오류");
    }
  });
};

//------------------------------------------------------------------------------------------------//
// Router(/:connectedid) -> connectedId 발급 시 사용하는 url
//------------------------------------------------------------------------------------------------//
router.post('/:connectedid', (req, res) => {
  const id = req.body.id;
  const pwd = req.body.password;
  const organization = req.body.organization;
  const businessType = req.body.businessType;
  const clientType = req.body.clientType;
  const loginType = req.body.loginType;

  console.log("\n\n" + id + " " + pwd + " "+ organization + " "+ businessType + " "+ clientType + " "+ loginType + " " + "\n\n");

  // var RSA_password = publicEncRSA(PUBLIC_KEY, pwd);

  console.log("나왔쪄");

  connected_body = create_accountList('KR', businessType, clientType, organization, loginType, id, pwd
    ,'', '', '', '', '');
  // CODEF API 요청
    // CODEF API request
    httpSender(codef_url + account_list_path, token, connected_body);

    // res.statusCode = 200;
    res.status(200).send("suceess!!");
});


//------------------------------------------------------------------------------------------------//
// 
//------------------------------------------------------------------------------------------------//
function create_accountList(countryCode, businessType, clientType, organization, loginType
  , id, password, birthDate, loginTypeLevel, clientTypeLevel, cardNo, cardPassword)
{
  const PUBLIC_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsPUBYBaCoHfnZA0vjfbArkiHts8SBVx1NCiSRmwVuKV341Oj80Csyx0mUdnv3agIRPG3puYMi2wbe+ZCAjXA7rttKN1rldidAcbqdth+tuL9WAVr4wPJ3eCJVkulghN7Gx5Y0bQr1YB3s/2rY87R17D/uFI0hjfF5ZmUtSFbLk2jh+MY1ToM+vQfrwlQNfTpNljjR6Hkd1lRKuDjth1z/KsEwP75baASRV+Pj4RePJE8u2Pqt4vYrLHMhnbOwVtuNSirG82sgJjgrq8QB2Jl71yYzwpg1UABOs7CrNbvtNm9xTswzTIXf7mQpPncryvk7To3d7QniWwUqLuiC4SzwQIDAQAB';

  RSA_password = publicEncRSA(PUBLIC_KEY, password);

  codef_account_create_body = {
    'accountList':[
      {
        "countryCode": countryCode,               // (필수)국가코드
        "businessType": businessType,             // (필수)업무구분 -> 은행,저축은행 : BK / 카드 : CD / 증권 : ST / 보험 : IS
        "clientType": clientType,                 // (필수)고객구분 -> 개인 : P / 기업, 법인 : B / 통합 : A
        "organization": organization,             // (필수)기관코드
        "loginType": loginType,                   // (필수)로그인방식 -> 인증서 : 0 / 아이디, 패스워드 : 1
        "id": id,                                 // (옵션)아이디방식 -> 아이디 방식일 경우 필수/ (키움)복수 계정 보유 고객의 경우 사용
        "password": RSA_password,                 // (필수)인증서 방식일 경우 인증서 패스워드 / 아이디 방식일 경우 아이디 패스우드 입력
        "birthDate": birthDate,                   // (옵션)생년월일
        //"loginTypeLevel": loginTypeLevel,       // (옵션)신한/롯데 법인카드의 경우 [로그인구분] 이용자 : 0 / 사업장/부서관리자 : 1 / 총괄관리자 : 2. (default : 2)
        //"clientTypeLevel": clientTypeLevel,     // (옵션)신한 법인카드의 경우 [회원구분] 신용카드 회원 : 0 / 체크카드 회원 : 1 / 연구비 신용카드 회원 : 2
        //"cardNo": cardNo,                       // (옵션)KB카드 소지확인 인증이 필요한 경우 필수 : 마스킹 없는 전체 카드번호 입력
        //"cardPassword": cardPassword,           // (옵션)KB카드 소지확인 필요한 경우 : 카드 비밀번호 앞 2자리
      }
    ]
  }
  
  return codef_account_create_body;
}

//------------------------------------------------------------------------------------------------//
// 카드 승인내역 조회
//------------------------------------------------------------------------------------------------//
// 데모 endpoint -> https://development.codef.io/v1/kr/card/p/account/approval-list
// 정식 endpoint -> https://api.codef.io/v1/kr/card/p/account/approval-list

var codef_card_url = "https://development.codef.io/v1/kr/card/p/account/approval-list"; // 데모
var codef_is_card_url = "https://development.codef.io/v1/kr/card/p/user/registration-status";

var codef_card_body = {
    "organization": codef_api_body.organization,
    "connectedId": codef_api_body.connectedId,
    "birthDate": "",
    "startDate": "20220101",
    "endDate": "20230517",
    "orderBy": "0",
    "inquiryType": "1",
    "cardName": "",
    "duplicateCardIdx": "0",
    "cardNo": "",
    "cardPassword": ""
};

// "organization": codef_api_body.organization,         // (필수)기관코드
// "connectedId": codef_api_body.connectedId,          // (필수)ConnectedID
// "cardNo": "",                // (옵션)카드번호 -> KB카드소지확인 인증이 필요한 경우 필수 : 카드번호 전체 입력.
// "cardPassword": "",       // (옵션)카드비밀번호 -> KB카드 소지확인 필요한 경우 : 카드비번 앞 2자리.
// "birthDate": "",             // (옵션)생년월일 -> [생년월일/주민등록번호] 제한직전 필수 입력하는 기관존재(YYYYMMDD)
// "inquiryType": "",   // (옵션)조회구분 -> [카드이미지 포함여부] -> 미포함 : 0 / 포함 : 1


//------------------------------------------------------------------------------------------------//
// 카드 승인내역 조회
//------------------------------------------------------------------------------------------------//
// 데모 endpoint -> https://development.codef.io/v1/kr/card/p/account/approval-list
// 정식 endpoint -> https://api.codef.io/v1/kr/card/p/account/approval-list

module.exports = router;