import commandLineUsage from 'command-line-usage';

export default (optionList) =>
  commandLineUsage([
    {
      header: 'Ticket stamp',
      content: 'Stamp out a new ticket entry',
    },
    {
      header: 'Synopsis',
      content: [
        '$ stamp [--ticket] {bold TKT-NUM | tktnum}',
        '$ stamp {bold [TKT-NUM] --update --list --promote --verbose}',
        '$ stamp {bold --help}',
      ],
    },
    {
      header: 'Options',
      optionList,
    },
  ]);
