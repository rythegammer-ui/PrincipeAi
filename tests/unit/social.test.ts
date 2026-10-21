import { describe, expect, it } from "vitest";
import { socialProfiles } from "@/lib/social";

describe("social profiles", () => {
  it("renders nothing while every profile is blank", () => {
    expect(socialProfiles({ youtube: "", instagram: " ", linkedin: "" })).toEqual([]);
  });

  it("keeps filled https profiles in display order with their labels", () => {
    expect(
      socialProfiles({
        linkedin: "https://www.linkedin.com/company/principe-ai",
        youtube: " https://www.youtube.com/@principeai ",
        x: "https://x.com/principeai",
      }),
    ).toEqual([
      { key: "youtube", label: "YouTube", url: "https://www.youtube.com/@principeai" },
      { key: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/principe-ai" },
      { key: "x", label: "X", url: "https://x.com/principeai" },
    ]);
  });

  it("skips handles, plain http and non-web links", () => {
    expect(
      socialProfiles({
        instagram: "@principeai",
        tiktok: "http://www.tiktok.com/@principeai",
        threads: "javascript:alert(1)",
        bluesky: "principeai.bsky.social",
      }),
    ).toEqual([]);
  });

  it("ignores keys it doesn't know", () => {
    expect(socialProfiles({ myspace: "https://myspace.com/principeai" })).toEqual([]);
  });
});
