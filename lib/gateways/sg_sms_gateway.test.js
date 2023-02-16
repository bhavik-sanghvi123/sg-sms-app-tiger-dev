/**
 * @jest-environment node
 */

const {
  uriLength,
  maxLength,
  formatValidation,
  Country,
  Message,
  sms_not_allowed,
  Send,
  DecodeCommzgate,
  CommzgateErrors,
  stripHTMLEntities,
  Mock,
} = require("./sg_sms_gateway");

const phonenumber = "93911204";

describe("SG SMS tests", () => {
  test("Singapore Numbers", () => {
    expect(formatValidation("+6593911204")).toBe(phonenumber);
    expect(formatValidation("006593911204")).toBe(phonenumber);
    expect(formatValidation(phonenumber)).toBe(phonenumber);
    expect(formatValidation("093911204")).toBe(phonenumber);
    expect(formatValidation("9391 1204")).toBe(phonenumber);
    expect(formatValidation("+65 9391 1204")).toBe(phonenumber);
    expect(() => formatValidation("3911204")).toThrow(Error);
    expect(formatValidation(" 93911204 ")).toBe(phonenumber);

    expect(formatValidation("91099630")).toBe("91099630");
    // house numbers
    expect(() => formatValidation(" 12345678 ")).toThrow(Error);
    expect(() => formatValidation("+6523456789")).toThrow(Error); // house number with country code
    expect(() => formatValidation("+65 345 67890 ")).toThrow(Error); // house number with country code and space
    expect(() => formatValidation("456 78910 ")).toThrow(Error); // house number with space
    expect(() => formatValidation("56789012")).toThrow(Error); // house number
    expect(() => formatValidation("67890123 ")).toThrow(Error); // house number with trailing space
    expect(() => formatValidation(" 78901234")).toThrow(Error); // house number with space at the front
    expect(() => formatValidation(" 123")).toThrow(Error); // too short
  });

  test("Singapore SMS gateway", () => {
    expect(Country).toBe("SG");
  });

  test("Singapore SMS message", () => {
    const encodedTextMessage =
      "This is a regular message with a special character &lt;adv>";
    const decodedTextMessage =
      "This is a regular message with a special character <adv>";
    const longMessage =
      "This is a long message and should exceed the 160 character limit of an sms and throw an error since there are no edge cases that send long messages that are greated than 160 characters, however this is not an end all test";
    const testcase01 = `To help us serve u better, pls rate ur overall satisfaction with our Nutrition Advisor @ http://cloud.sg.abbottnutrition.com/Survey-WCH . Unsub "ABNO" to 73333`;
    const testcase02 = `Congrats on completing 90-Day G.O.A.L.S Program! Share your feedback @ http://cloud.sg.abbottnutrition.com/Survey & get a $10 voucher*. *TnCs. Unsub "ABNO" to 73333`;

    const data = {
      phoneNumber: phonenumber,
      textMessage: encodedTextMessage,
      brandNames: "SG SMS",
    };

    expect(Message(data)).toHaveProperty("Mobile", `65${data.phoneNumber}`);
    expect(Message(data)).toHaveProperty("Message", decodedTextMessage);
    expect(Message(data)).toHaveProperty("Sender", data.brandNames);

    expect(Message(data)).toHaveProperty("ID");
    expect(Message(data)).toHaveProperty("Password");
    expect(Message(data)).toHaveProperty("Sender");
    expect(Message(data)).toHaveProperty("Type");

    expect(() => Message({ ...data, phoneNumber: "" })).toThrow(Error);
    expect(() => Message({ ...data, textMessage: "" })).toThrow(Error);
    expect(() => Message({ ...data, brandNames: "" })).toThrow(Error);
    expect(() => Message({ ...data, textMessage: longMessage })).toThrow(Error);

    expect(() => Message({ ...data, textMessage: testcase01 })).not.toThrow(
      Error
    );
    expect(() => Message({ ...data, textMessage: testcase02 })).not.toThrow(
      Error
    );
  });
  test("SMS cases that we've seen fail", () => {
    const testcase01 = `To help us serve u better, pls rate ur overall satisfaction with our Nutrition Advisor @ http://cloud.sg.abbottnutrition.com/Survey-WCH . Unsub "ABNO" to 73333`;
    const testcase02 = `Congrats on completing 90-Day G.O.A.L.S Program! Share your feedback @ http://cloud.sg.abbottnutrition.com/Survey & get a $10 voucher*. *TnCs. Unsub "ABNO" to 73333`;

    expect(stripHTMLEntities(testcase01)).toBe(testcase01);
    expect(stripHTMLEntities(testcase02)).toBe(testcase02);

    expect(uriLength(testcase01)).toBe(46);
    expect(uriLength(testcase02)).toBe(42);

    expect(() => maxLength(testcase01)).not.toThrow(Error);
    expect(() => maxLength(testcase02)).not.toThrow(Error);
  });
  test("SMS should not be sent", () => {
    expect(sms_not_allowed("True")).toBe(true);
    expect(sms_not_allowed("False")).toBe(false);
  });
  test("SMS is not allowed", async () => {
    expect.assertions(1);
    const message = Message({
      phoneNumber: phonenumber,
      textMessage: "This is a regular message but should not be sent, Test 1",
      brandNames: "SG SMS Test 1",
    });
    try {
      await Send({ smsBoolean: "True", message });
    } catch (e) {
      expect(e).toEqual(new Error("SMS not allowed"));
    }
  });

  test("SMS SG Mock", () => {
    expect(process.env.SMS_SG_USERNAME).toBeDefined();
    expect(process.env.SMS_SG_USERNAME).not.toBe("username");
    expect(process.env.SMS_SG_PASSWORD).toBeDefined();
    expect(process.env.SMS_SG_PASSWORD).not.toBe("password");
    const message = Message({
      phoneNumber: phonenumber,
      textMessage:
        "This is a regular message but should not be sent in the real world, Test 2",
      brandNames: "SG SMS Test 2",
    });

    return Mock({ smsBoolean: "False", message }).then((data) => {
      expect(data).resolves;
    });
  });

  test("SG SMS response decoding", () => {
    const Success = "01010,c1_16067874645342642";
    const Fail = "01012";

    // success
    expect(DecodeCommzgate(Success)).toHaveProperty("state", "01010");
    expect(DecodeCommzgate(Success)).toHaveProperty(
      "responsetoken",
      "c1_16067874645342642"
    );
    expect(DecodeCommzgate(Success)).toHaveProperty(
      "status",
      CommzgateErrors["01010"]
    );

    // failure
    expect(DecodeCommzgate(Fail)).toHaveProperty("state", "01012");
    expect(DecodeCommzgate(Fail)).toHaveProperty("responsetoken", null);
    expect(DecodeCommzgate(Fail)).toHaveProperty(
      "status",
      CommzgateErrors["01012"]
    );
  });

  test("SG SMS Decoding entities", () => {
    const encoded =
      "hello, test with entities, &lt;adv> &amp;%, should be recoded";
    const decoded = "hello, test with entities, <adv> &%, should be recoded";

    expect(stripHTMLEntities(encoded)).toBe(decoded);
  });
});

describe("Max Length of messages should not exceed 160 characters", () => {
  const noURL =
    'Thanks for your request! Your Glucerna kit is on its way. Unsub "ABNO" to 73333';
  const clean =
    'Thanks for your request! Your Glucerna kit is on its way. Prepare it right with our recipes @ http://bit.ly/shopGLU01 ! Unsub "ABNO" to 73333';
  const withperiod =
    'Fuel your kid’s adventure with GROW! Enjoy 10% OFF* on 900g pack + FREE delivery @ http://bit.ly/shopGW01. *TnCs. Unsub "ABNO" to 73333 ';
  const onesixtycharacters =
    'Fuel your kid’s with one adventure with GROW! Enjoy 10% OFF* on 900g pack + FREE delivery @ http://bit.ly/shopGW01.html *TnCs. Unsub "ABNO" to 73333 ';

  const onesixtycharactersnourl =
    'Fuel your kid’s with one adventure with GROW! Enjoy 10% OFF* on 900g pack + FREE delivery @ when you go to one sixty characters *TnCs. Unsub "ABNO" to 73333 123';
  const tooLongWillFail =
    'Fuel your kid’s adventure with GROW! Enjoy 10% OFF* on 900g pack + FREE delivery @ http://bit.ly/shopGW01.html. *TnCs. Unsub "ABNO" to 73333 but super long and exceed the 160 characters';

  test("max character length", () => {
    expect(uriLength(noURL)).toBe(0);
    expect(uriLength(clean)).toBe(23);
    expect(uriLength(withperiod)).toBe(22);
    expect(uriLength(onesixtycharacters)).toBe(27);
    expect(uriLength(onesixtycharactersnourl)).toBe(0);
    expect(uriLength(tooLongWillFail)).toBe(27);
  });
  test("max message length", () => {
    expect(maxLength(noURL)).toEqual(noURL);
    expect(() => maxLength()).toThrow(Error);
    expect(maxLength(onesixtycharacters)).toEqual(onesixtycharacters);
    expect(maxLength(onesixtycharactersnourl)).toEqual(onesixtycharactersnourl);
    expect(() => maxLength(tooLongWillFail)).toThrow(Error);
  });
});

describe("multiple requests to mock should not fail", () => {
  test("request 1", async () => {
    const message = Message({
      phoneNumber: phonenumber,
      textMessage:
        "This is a regular message but should not be sent in the real world",
      brandNames: "SMS Test",
    });

    let test = await Mock({ smsBoolean: "False", message });

    expect(test.HTTPStatus).toBe(200);
  });
  test("request 2", async () => {
    const message = Message({
      phoneNumber: phonenumber,
      textMessage:
        "This is a regular message but should not be sent in the real world",
      brandNames: "SMS Test",
    });

    let test = await Mock({ smsBoolean: "False", message });

    expect(test.HTTPStatus).toBe(200);
  });
  test("request 3", async () => {
    const message = Message({
      phoneNumber: phonenumber,
      textMessage:
        "This is a regular message but should not be sent in the real world",
      brandNames: "SMS Test",
    });

    let test = await Mock({ smsBoolean: "False", message });

    expect(test.HTTPStatus).toBe(200);
  });
});
