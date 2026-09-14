// Compatibility facade for existing callers and test imports. No SDK logic here.
export * from "../../infrastructure/firebase/projectRepository";
export { importLocalProjectsOnce } from "../../features/runtime/projectSyncServices";
