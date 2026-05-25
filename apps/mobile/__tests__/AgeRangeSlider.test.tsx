import React from "react";
import { render } from "@testing-library/react-native";

import AgeRangeSlider, {
  clampMaxAgeRange,
  clampMinAgeRange,
} from "../components/AgeRangeSlider";

describe("AgeRangeSlider", () => {
  it("renders the selected and boundary values", () => {
    const { getByText } = render(
      <AgeRangeSlider min={18} max={99} value={[25, 40]} onChange={jest.fn()} />,
    );

    expect(getByText("25")).toBeTruthy();
    expect(getByText("40")).toBeTruthy();
    expect(getByText("18")).toBeTruthy();
    expect(getByText("99")).toBeTruthy();
  });

  it("does not let the minimum value move above the maximum value", () => {
    expect(clampMinAgeRange([25, 40], 45)).toEqual([40, 40]);
    expect(clampMinAgeRange([25, 40], 30)).toEqual([30, 40]);
  });

  it("does not let the maximum value move below the minimum value", () => {
    expect(clampMaxAgeRange([25, 40], 20)).toEqual([25, 25]);
    expect(clampMaxAgeRange([25, 40], 35)).toEqual([25, 35]);
  });
});
