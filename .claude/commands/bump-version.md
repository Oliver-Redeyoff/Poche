Update the mobile app version to $ARGUMENTS across all 5 required locations:

1. `mobile_app/app.json` — `"version"` field
2. `mobile_app/package.json` — `"version"` field
3. `mobile_app/ios/Poche/Info.plist` — `CFBundleShortVersionString`
4. `mobile_app/ios/ShareExtension/Info.plist` — `CFBundleShortVersionString`
5. `mobile_app/ios/Poche.xcodeproj/project.pbxproj` — `MARKETING_VERSION` (appears 4 times, use replace_all)

Read each file first, then make the edits. After all edits are done, run `git diff --stat` to confirm exactly those 5 files changed and no others.

If $ARGUMENTS is empty, ask the user for the new version number before proceeding.
