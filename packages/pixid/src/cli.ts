// `npx pixid` and `npx @pixid/cli` must behave identically, so this bin is a
// shim that runs the one implementation instead of a second copy of it.
import '@pixid/cli/run';
