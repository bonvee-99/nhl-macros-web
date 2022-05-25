/*
html:
- dropdown pick team
- display macros (click to copy)

ts:
- api req
- organize data
- build string
*/

enum Sort {
  Name,
  Number
}

// ----- ----- -----
const url = "https://statsapi.web.nhl.com/api/v1/teams";

// default team 
let chosen_team: string;

// chosen code (default is first letter of team name if not specified)
let chosen_code: string;

// specifies whether user wants macros ordered (doesn't affect functionality)
let sort_data: boolean = true;
// specifies sort type (first name by default)
let sort_type: Sort = Sort.Name;

function set_chosen_team() {
  // drop down
}

// needs to be async?
async function main() {
  try {
    let team_data = await get_team_data(chosen_team);

    if (sort_data) {
      sort_players(team_data.players, sort_type);
    }

    let macro_string: string = build_team_macros(team_data, chosen_code);
    // @ts-ignore
    document.getElementById("display-box").value = macro_string;
  } catch (error: unknown) {
    console.log(error);
    alert("error building macros");
  }
}

// gets player data for specified NHL team
async function get_team_data(team: any) {
  const teams_response = await fetch(url);
  const teams_parse_response = await teams_response.json();

  let id: number | undefined;
  teams_parse_response.teams.find((t: any) => {
    if (t.name == team) {
      id = t.id;
    }
    return false;
  });
  if (!id) {
    throw Error("No team with the given name");
  }

  const players_response = await fetch(`${url}/${id}?expand=team.roster`);
  const players_parse_response = await players_response.json();

  return {
    team,
    players: players_parse_response.teams[0].roster.roster
  }
}

// builds macro string for given team based on given code
function build_team_macros(team_data: any, code: any): string {
  if (!code) {
    code = team_data.team.slice(0, 1);
    code = code.toLowerCase();
  }

  let output_string: string = "";

  // team name macro
  output_string += `${code}\tthe ${team_data.team}\n\n`;

  // build player macros
  team_data.players.forEach((player: any) => {
    let name: string = player.person.fullName;
    let number: number = player.jerseyNumber;
    // \v, \vv, \vvv
    output_string +=
      `\n\n${code}${number}\t${name} #${number} of the ${team_data.team}\n${code}${code}${number}\t${name}\n${code}${code}${code}${number}\t${name} #${number}`;
  });

  return output_string;
}

function sort_players(players: any, sort_by: any) {
  let compare_fn: Function;
  if (sort_by == Sort.Name) {
    compare_fn = (player1: any, player2: any) => {
      return player1.person.fullName.split(" ")[1].localeCompare(player2.person.fullName.split(" ")[1]);
    }
  } else {
    compare_fn = (player1: any, player2: any) => {
      if (parseInt(player1.jerseyNumber) < parseInt(player2.jerseyNumber)) return -1;
      else return 1;
    }
  }
  players.sort(compare_fn);
}

// copies dispalyed macro string to clipboard
function copy_macros() {
  const macro_string = <HTMLInputElement>document.getElementById("display-box");
  if (macro_string) {
    navigator.clipboard.writeText(macro_string.value);
    alert("copied text to clipboard");
  }
}
