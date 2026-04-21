export type GeneratedRecord = Record<string, unknown>;

export type ParseResponseBody = {
  interfaces?: string[];
};

export type GenerateResponseBody = {
  data?: GeneratedRecord[];
  error?: string;
};
