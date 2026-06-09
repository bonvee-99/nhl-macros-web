import type { Player, Team } from "./api";

export type SortBy = "name" | "number";

// Returns a sorted copy of the players array.
export function sort_players(players: Player[], sort_by: SortBy): Player[] {
  const sorted = [...players];
  if (sort_by === "name") {
    sorted.sort((a, b) => a.lastName.default.localeCompare(b.lastName.default));
  } else {
    sorted.sort(
      (a, b) => parseInt(a.sweaterNumber) - parseInt(b.sweaterNumber),
    );
  }
  return sorted;
}

// Builds the macro string for a team given an optional macro code.
// Defaults the code to the first letter of the team name (lowercased).
export function build_team_macros(team: Team, code?: string): string {
  const macroCode = code ? code : team.name.slice(0, 1).toLowerCase();

  let output = `${macroCode}\tthe ${team.name}\n\n`;

  for (const player of team.players) {
    const name = `${player.firstName.default} ${player.lastName.default}`;
    const number = parseInt(player.sweaterNumber);
    output +=
      `\n\n${macroCode}${number}\t${name} #${number} of the ${team.name}` +
      `\n${macroCode}${macroCode}${number}\t${name}` +
      `\n${macroCode}${macroCode}${macroCode}${number}\t${name} #${number}`;
  }

  return output;
}
