import UIKit
import UniformTypeIdentifiers

final class ShareViewController: UIViewController {

  private var statusLabel: UILabel!
  private var activityIndicator: UIActivityIndicatorView!

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = UIColor.systemBackground

    activityIndicator = UIActivityIndicatorView(style: .medium)
    activityIndicator.translatesAutoresizingMaskIntoConstraints = false
    activityIndicator.hidesWhenStopped = true

    statusLabel = UILabel()
    statusLabel.translatesAutoresizingMaskIntoConstraints = false
    statusLabel.text = "Saving to Poche..."
    statusLabel.font = .systemFont(ofSize: 17, weight: .regular)
    statusLabel.textColor = .secondaryLabel
    statusLabel.textAlignment = .center

    let stack = UIStackView(arrangedSubviews: [activityIndicator, statusLabel])
    stack.translatesAutoresizingMaskIntoConstraints = false
    stack.axis = .vertical
    stack.spacing = 12
    stack.alignment = .center
    view.addSubview(stack)

    NSLayoutConstraint.activate([
      stack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
      stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
    ])
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    activityIndicator.startAnimating()
    handleShare()
  }

  private func setStatus(_ text: String) {
    DispatchQueue.main.async { [weak self] in
      self?.statusLabel?.text = text
    }
  }

  private func handleShare() {
    guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
          let itemProviders = extensionItem.attachments else {
      setStatus("No content to save")
      completeRequest(after: 0.8)
      return
    }

    if let urlProvider = itemProviders.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.url.identifier) }) {
      loadURL(from: urlProvider)
      return
    }

    if let textProvider = itemProviders.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) }) {
      loadText(from: textProvider)
      return
    }

    setStatus("No link found")
    completeRequest(after: 0.8)
  }

  private func loadURL(from provider: NSItemProvider) {
    provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] item, _ in
      guard let self else { return }

      var sharedUrl: URL?
      if let url = item as? URL {
        sharedUrl = url
      } else if let data = item as? Data,
                let urlString = String(data: data, encoding: .utf8),
                let url = URL(string: urlString) {
        sharedUrl = url
      }

      guard let sharedUrl else {
        DispatchQueue.main.async {
          self.setStatus("No link found")
          self.completeRequest(after: 0.8)
        }
        return
      }

      DispatchQueue.main.async {
        self.openHostApp(with: sharedUrl.absoluteString)
      }
    }
  }

  private func loadText(from provider: NSItemProvider) {
    provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] item, _ in
      guard let self else { return }

      let text = item as? String
      let sharedUrl = text.flatMap(self.extractFirstUrl(from:))

      DispatchQueue.main.async {
        if let sharedUrl {
          self.openHostApp(with: sharedUrl)
        } else {
          self.setStatus("No link found")
          self.completeRequest(after: 0.8)
        }
      }
    }
  }

  private func extractFirstUrl(from text: String) -> String? {
    guard let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue) else {
      return nil
    }

    let range = NSRange(text.startIndex..<text.endIndex, in: text)
    guard let match = detector.matches(in: text, options: [], range: range).first,
          let url = match.url else {
      return nil
    }

    guard let scheme = url.scheme?.lowercased(), scheme == "http" || scheme == "https" else {
      return nil
    }

    return url.absoluteString
  }

  private static let appGroupId = "group.org.name.Poche"
  private static let shareJustSavedKey = "PocheShareJustSaved"
  private static let shareTokenKey = "PocheShareToken"
  private static let shareApiUrlKey = "PocheShareApiUrl"

  private func openHostApp(with sharedUrl: String) {
    guard let defaults = UserDefaults(suiteName: Self.appGroupId),
          let token = defaults.string(forKey: Self.shareTokenKey),
          let apiUrl = defaults.string(forKey: Self.shareApiUrlKey),
          !token.isEmpty,
          !apiUrl.isEmpty else {
      setStatus("Sign in to Poche first")
      completeRequest(after: 1.5)
      return
    }

    setStatus("Saving to Poche...")
    saveArticleViaAPI(sharedUrl: sharedUrl, token: token, apiUrl: apiUrl)
  }

  private func saveArticleViaAPI(sharedUrl: String, token: String, apiUrl: String) {
    let endpoint = apiUrl.hasSuffix("/") ? apiUrl + "api/articles" : apiUrl + "/api/articles"
    guard let url = URL(string: endpoint) else {
      setStatus("Save failed")
      completeRequest(after: 1.5)
      return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.httpBody = try? JSONSerialization.data(withJSONObject: ["url": sharedUrl])

    let task = URLSession.shared.dataTask(with: request) { [weak self] _, response, _ in
      guard let self else { return }
      let http = response as? HTTPURLResponse
      let saved = http?.statusCode == 201 || http?.statusCode == 409
      if saved, let defaults = UserDefaults(suiteName: Self.appGroupId) {
        defaults.set(true, forKey: Self.shareJustSavedKey)
        defaults.synchronize()
      }
      DispatchQueue.main.async {
        self.setStatus(saved ? "Saved!" : "Save failed")
        self.completeRequest(after: 1.0)
      }
    }
    task.resume()
  }

  private func completeRequest(after delay: TimeInterval) {
    DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
      self?.completeRequest()
    }
  }

  private func completeRequest() {
    activityIndicator?.stopAnimating()
    extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
  }
}
