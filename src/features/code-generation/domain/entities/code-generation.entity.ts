export type SpringBootConfigInput = {
  packageName?: string;
  artifactId?: string;
  databaseName?: string;
};

export type GeneratedBackendFile = {
  fileName: string;
  contentType: string;
  blob: Blob;
};
