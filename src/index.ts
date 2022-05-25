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
// specifies sort type (first name by default)
let sort_type: Sort = Sort.Name;

// needs to be async?
async function main() {
  try {
    let team_data = await get_team_data((<HTMLInputElement>document.getElementById("chosen-team")).value);

    sort_players(team_data.players, parseInt((<HTMLInputElement>document.getElementById("order")).value));



    let macro_string: string = build_team_macros(team_data, (<HTMLInputElement>document.getElementById("code")).value);

    (<HTMLInputElement>document.getElementById("display-box")).value = macro_string;
  } catch (error: unknown) {
    console.log(error);
    // @ts-ignore
    alert(error.message);
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

function sort_players(players: any, sort_by: Sort) {
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
async function copy_macros() {
  const macro_string = <HTMLInputElement>document.getElementById("display-box");
  if (macro_string) {
    await navigator.clipboard.writeText(macro_string.value);
    alert("copied text to clipboard");
  }
}

async function build_input_list() {
  let select_elem = <HTMLElement>document.getElementById("team-list");
  const teams_response = await fetch(url);
  const teams_parse_response = await teams_response.json();

  teams_parse_response.teams.forEach((team: any) => {

    let team_elem = document.createElement("option");
    team_elem.value = team.name;
    select_elem.appendChild(team_elem);
  });
}

build_input_list();

