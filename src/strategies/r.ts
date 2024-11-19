// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions } from './base';
import { Update } from '../update';
import { News } from '../updaters/r/news';
import { Version } from '../version';
import { DescriptionUpdater } from '../updaters/r/description';
import { FileNotFoundError } from '../errors';
import { filterCommits } from '../util/filter-commits';

const CHANGELOG_SECTIONS = [
  { type: 'feat', section: 'Features' },
  { type: 'fix', section: 'Bug Fixes' },
  { type: 'perf', section: 'Performance Improvements' },
  { type: 'deps', section: 'Dependencies' },
  { type: 'revert', section: 'Reverts' },
  { type: 'docs', section: 'Documentation' },
  { type: 'style', section: 'Styles', hidden: true },
  { type: 'chore', section: 'Miscellaneous Chores', hidden: true },
  { type: 'refactor', section: 'Code Refactoring', hidden: true },
  { type: 'test', section: 'Tests', hidden: true },
  { type: 'build', section: 'Build System', hidden: true },
  { type: 'ci', section: 'Continuous Integration', hidden: true },
];

export class R extends BaseStrategy {
  constructor(options: BaseStrategyOptions) {
    options.changelogPath = options.changelogPath ?? 'NEWS.md';
    options.changelogSections = options.changelogSections ?? CHANGELOG_SECTIONS;
    super(options);
  }

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;

    updates.push({
      path: this.addPath(this.changelogPath),
      createIfMissing: true,
      updater: new News({
        version,
        changelogEntry: options.changelogEntry,
      }),
    });

    updates.push({
      path: this.addPath('DESCRIPTION'),
      createIfMissing: false,
      updater: new DescriptionUpdater({
        version,
      }),
    });

    return updates;
  }

  protected async getPackageNameFromDescription(): Promise<string | null> {
    try {
      const descriptionContent = (
        await this.github.getFileContentsOnBranch(
          this.addPath('DESCRIPTION'),
          this.targetBranch
        )
      ).parsedContent;

      const match = descriptionContent.match(/^Package:\s*(.+)\s*$/m);
      return match ? match[1] : null;
    } catch (e) {
      if (e instanceof FileNotFoundError) {
        return null;
      } else {
        throw e;
      }
    }
  }

  protected initialReleaseVersion(): Version {
    return Version.parse('0.1.0');
  }
}
