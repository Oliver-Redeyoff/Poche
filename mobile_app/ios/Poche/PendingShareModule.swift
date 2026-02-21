import Foundation

@objc(PendingShareModule)
class PendingShareModule: NSObject {

  private static let appGroupId = "group.org.name.Poche"
  private static let shareJustSavedKey = "PocheShareJustSaved"
  private static let shareTokenKey = "PocheShareToken"
  private static let shareApiUrlKey = "PocheShareApiUrl"

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  private static var groupDefaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  @objc func getShareExtensionJustSaved(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = Self.groupDefaults else {
      resolve(false)
      return
    }
    let justSaved = defaults.bool(forKey: Self.shareJustSavedKey)
    if justSaved {
      defaults.removeObject(forKey: Self.shareJustSavedKey)
      defaults.synchronize()
    }
    resolve(justSaved)
  }

  @objc func setShareCredentials(_ token: String, apiUrl: String) {
    Self.groupDefaults?.set(token, forKey: Self.shareTokenKey)
    Self.groupDefaults?.set(apiUrl, forKey: Self.shareApiUrlKey)
    Self.groupDefaults?.synchronize()
  }

  @objc func clearShareCredentials() {
    Self.groupDefaults?.removeObject(forKey: Self.shareTokenKey)
    Self.groupDefaults?.removeObject(forKey: Self.shareApiUrlKey)
    Self.groupDefaults?.synchronize()
  }
}
