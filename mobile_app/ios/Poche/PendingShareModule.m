#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PendingShareModule, NSObject)

RCT_EXTERN_METHOD(getShareExtensionJustSaved:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setShareCredentials:(NSString *)token apiUrl:(NSString *)apiUrl)
RCT_EXTERN_METHOD(clearShareCredentials)

@end
