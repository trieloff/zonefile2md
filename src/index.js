#!/usr/bin/env node
/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import fs from 'fs';
import path from 'path';
import { parseZoneFile } from 'zone-file';
import { u } from 'unist-builder';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';

function formatRecord(name) {
  if (name === 'ttl') {
    return 'TTL';
  }
  if (name === 'ns') {
    return 'NS (Name Server)';
  }
  if (name === 'soa') {
    return 'SOA (Start of Authority)';
  }
  if (name === 'cname') {
    return 'CNAME (Canonical Name)';
  }
  if (name === 'txt') {
    return 'TXT (Text)';
  }
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
}
export function main(args) {
  const name = args.pop();
  // check if the file exists
  const filePath = path.resolve(process.cwd(), name);
  let contents = '';
  if (fs.existsSync(filePath)) {
    contents = fs.readFileSync(filePath, 'utf8');
  } else if (name === '-') {
    contents = fs.readFileSync(0, 'utf8');
  }

  const zone = parseZoneFile(contents);

  const mdast = u('root', [
    u('heading', [
      u('text', `DNS Records for ${zone.soa.name}`),
    ]),
    ...Object.entries(zone)
      .filter(([record]) => record !== 'soa')
      .map(([record, entries]) => {
        const children = [];
        children.push(u('heading', { depth: 2 }, [
          u('text', formatRecord(record)),
        ]));
        if (Array.isArray(entries)) {
          const table = u(
            'table',
            {},
            [
              u('tableRow', [
                ...Object.keys(entries[0]).map((key) => u('tableCell', [u('text', formatRecord(key))])),
              ]),
              ...entries.map((entry) => u('tableRow', [
                ...Object.values(entry).map((value) => u('tableCell', [u('text', `${value}`)])),
              ])),
            ],
          );
          children.push(table);
        }
        return children;
      }).flat(),
  ]);

  // eslint-disable-next-line no-console
  console.log(toMarkdown(mdast, { extensions: [gfmToMarkdown()] }));
}

main(process.argv);
