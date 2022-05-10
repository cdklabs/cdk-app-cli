import * as path from "path";
import * as fs from "fs-extra";
import * as yaml from "yaml";
import { deepMerge } from "./util";

export const CONSTRUCT_COMMANDS_FILES = [
  "construct-commands.json",
  "construct-commands.yaml",
  "construct-commands.yml",
];

export class CommandStore {
  private readonly _commands: ConstructCommandsFile;
  constructor() {
    // load the default construct commands
    this._commands = fs.readJsonSync(
      path.join(__dirname, "..", "construct-commands.json")
    );

    // check if user has defined custom commands
    const dir = process.cwd();

    for (const filename of CONSTRUCT_COMMANDS_FILES) {
      const relative = path.join(dir, filename);
      if (fs.existsSync(relative)) {
        const extraCommands = yaml.parse(
          fs.readFileSync(relative).toString("utf-8")
        );
        this._commands = deepMerge(this._commands, extraCommands);
      }
    }
  }

  public commandsForResourceType(fqn: string): ConstructCommands | undefined {
    return this._commands[fqn];
  }

  public findCommand(fqn: string, subcommand: string): Command | undefined {
    const commands = this.commandsForResourceType(fqn);
    if (!commands) return undefined;

    const command = commands[subcommand];
    return command;
  }
}

// Map from resource types to command list
interface ConstructCommandsFile {
  [fqn: string]: ConstructCommands;
}

// Map from command names to command definitions
interface ConstructCommands {
  [key: string]: Command;
}

interface Command {
  // run a process in the shell
  readonly exec?: string;
  // open a file or url
  readonly open?: string;
}
