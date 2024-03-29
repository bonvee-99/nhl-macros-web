// ----- TYPES -----
interface Player {
  sweaterNumber: string;
  firstName: {
    default: string;
  },
  lastName: {
    default: string;
  }
}

// TODO: fix here and in building part!
interface Team {
  name: string;
  players: Array<Player>;
}

enum Sort {
  Name,
  Number
}

interface ApiResponse {
  statusCode: number,
  headers: object,
  body?: string
}

// ----- ----- -----
const localUrl = "http://localhost:3000";
const prodUrl = "https://0d27ux40wd.execute-api.us-west-1.amazonaws.com/prod";

// specifies sort type (first name by default)
let sort_type: Sort = Sort.Name;

// needs to be async?
async function main() {
  try {
    let team_data: Team = await get_team_data((<HTMLInputElement>document.getElementById("chosen-team")).value);

    sort_players(team_data.players, parseInt((<HTMLInputElement>document.getElementById("order")).value));

    let macro_string: string = build_team_macros(team_data, (<HTMLInputElement>document.getElementById("code")).value);

    (<HTMLInputElement>document.getElementById("display-box")).value = macro_string;
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      alert(error.message);
    }
  }
}

// gets player data for specified NHL team
async function get_team_data(team: string): Promise<Team> {
  const teams_response = await fetch(`${prodUrl}/teams`);
  const teams_parse_response = await teams_response.json();
  const teams = JSON.parse(teams_parse_response.body); 

  // TODO: this sucks (should cache this on page load)
  let triCode: string | undefined;
  teams.find((t: any) => {
    if (t.fullName == team) {
      triCode = t.triCode;
    }
    return false;
  });
  if (!triCode) {
    throw Error("No team with the given name");
  }

  const players_response = await fetch(`${prodUrl}/roster?tricode=${triCode}`);
  const players = await players_response.json();

  const forwards = players.forwards;
  const defensemen = players.defensemen;
  const goalies = players.goalies;
  const all_players = [].concat(forwards, defensemen, goalies);

  return {
    name: team,
    players: all_players
  }
}

// builds macro string for given team based on given code
function build_team_macros(team_data: Team, code: string | undefined): string {
  if (!code) {
    code = <string>team_data.name.slice(0, 1);
    code = code.toLowerCase();
  }

  let output_string: string = "";

  // team name macro
  output_string += `${code}\tthe ${team_data.name}\n\n`;

  // build player macros
  team_data.players.forEach((player: Player) => {
    let name: string = player.firstName.default + " " + player.lastName.default;
    let number: number = parseInt(player.sweaterNumber);
    // \v, \vv, \vvv
    output_string +=
      `\n\n${code}${number}\t${name} #${number} of the ${team_data.name}\n${code}${code}${number}\t${name}\n${code}${code}${code}${number}\t${name} #${number}`;
  });

  return output_string;
}

function sort_players(players: Array<Player>, sort_by: Sort) {
  let compare_fn: (player1: Player, player2: Player) => number;
  if (sort_by == Sort.Name) {
    compare_fn = (player1: Player, player2: Player) => {
      return player1.lastName.default.localeCompare(player2.lastName.default);
    }
  } else {
    compare_fn = (player1: Player, player2: Player) => {
      if (parseInt(player1.sweaterNumber) < parseInt(player2.sweaterNumber)) return -1;
      else return 1;
    }
  }
  players.sort(compare_fn);
}

// copies dispalyed macro string to clipboard
async function copy_macros() {
  const macro_string = <HTMLInputElement>document.getElementById("display-box");
  if (macro_string) {
    await navigator.clipboard.writeText(macro_string.value);
    alert("copied text to clipboard");
  }
}

async function build_input_list() {
  let select_elem = <HTMLElement>document.getElementById("team-list");
  const teams_response = await fetch(`${prodUrl}/teams`);
  const teams_parse_response = await teams_response.json();
  const teams = JSON.parse(teams_parse_response.body); 

  teams.forEach((team: any) => {
    let team_elem = document.createElement("option");
    team_elem.value = team.fullName;
    select_elem.appendChild(team_elem);
  });
}

build_input_list();
