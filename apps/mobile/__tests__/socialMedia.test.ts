import {
  getLegacySocialMediaInputs,
  parseFacebook,
  parseInstagram,
} from "../lib/socialMedia";

describe("socialMedia", () => {
  it("keeps legacy plain Instagram values readable", () => {
    expect(getLegacySocialMediaInputs("@oldhandle")).toEqual({
      instagram: "@oldhandle",
      facebook: "",
    });
    expect(parseInstagram("@oldhandle")).toEqual({
      handle: "@oldhandle",
      url: "https://instagram.com/oldhandle",
    });
  });

  it("reads legacy combined Instagram and Facebook values", () => {
    const encoded = JSON.stringify({
      instagram: "@insta",
      facebook: "facebook.name",
    });

    expect(getLegacySocialMediaInputs(encoded)).toEqual({
      instagram: "@insta",
      facebook: "facebook.name",
    });
    expect(parseInstagram("@insta")).toEqual({
      handle: "@insta",
      url: "https://instagram.com/insta",
    });
    expect(parseFacebook("facebook.name")).toEqual({
      label: "facebook.name",
      url: "https://facebook.com/facebook.name",
    });
  });

  it("accepts full Facebook and Instagram URLs", () => {
    expect(parseInstagram("https://www.instagram.com/insta.name")).toEqual({
      handle: "@insta.name",
      url: "https://www.instagram.com/insta.name",
    });
    expect(parseFacebook("https://www.facebook.com/facebook.name")).toEqual({
      label: "facebook.name",
      url: "https://www.facebook.com/facebook.name",
    });
  });
});
